import { config } from '../config/index.js';
import { User } from '../models/index.js';
import { listRoutingRules } from './routingRulesService.js';
import { createTask } from './tasksService.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function extractDomain(fromEmail) {
  const email = String(fromEmail || '').toLowerCase();
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1) : email;
}

export function matchesCondition(rule, emailDoc) {
  const conditionType = rule.condition_type;
  const needle = normalize(rule.condition_value);
  if (!needle) return false;

  switch (conditionType) {
    case 'subject_contains':
      return normalize(emailDoc.subject).includes(needle);
    case 'from_contains': {
      const haystack = `${emailDoc.from_email || ''} ${emailDoc.from_name || ''}`;
      return normalize(haystack).includes(needle);
    }
    case 'body_contains': {
      const haystack = `${emailDoc.body_text || ''} ${emailDoc.body_preview || ''}`;
      return normalize(haystack).includes(needle);
    }
    case 'from_domain': {
      const domain = extractDomain(emailDoc.from_email);
      return domain === needle || domain.endsWith(`.${needle}`);
    }
    default:
      return false;
  }
}

export function applyAction(rule, emailDoc) {
  const actionType = rule.action_type;
  const actionValue = rule.action_value;

  switch (actionType) {
    case 'assign_to':
      // Sync path uses applyAssignToAction (creates task). Fallback for callers that only need metadata.
      return {
        assigned_to_user_id: actionValue,
        status_in_system: 'triaged',
      };
    case 'set_category':
      return {
        category: actionValue,
        suggested_category: actionValue,
      };
    case 'set_priority':
      return {
        suggested_priority: actionValue,
      };
    case 'add_tag': {
      const tag = String(actionValue || '').trim();
      if (!tag) return {};
      const existing = Array.isArray(emailDoc.tags) ? emailDoc.tags : [];
      if (existing.includes(tag)) return {};
      return { tags: [...existing, tag] };
    }
    default:
      return {};
  }
}

async function applyAssignToAction(emailDoc, rule) {
  const assigneeId = rule.action_value;
  if (!assigneeId) return {};

  if (emailDoc.linked_task_id) {
    return {
      assigned_to_user_id: assigneeId,
      linked_task_id: emailDoc.linked_task_id,
      status_in_system: emailDoc.status_in_system || 'converted',
    };
  }

  const user = await User.findOne(withTenant({ id: assigneeId })).lean();
  const task = await createTask({
    pillar: (emailDoc.subject || '(no subject)').trim(),
    brief_description: (emailDoc.body_preview || emailDoc.body_text || '').slice(0, 4000),
    lead_user_id: assigneeId,
    lead_user_name: user?.full_name || user?.email || '',
    priority: emailDoc.suggested_priority || 'medium',
    source_email_id: emailDoc.id,
    status: 'not_started',
    tags: Array.isArray(emailDoc.tags) ? [...emailDoc.tags] : [],
  });

  return {
    assigned_to_user_id: assigneeId,
    linked_task_id: task.id,
    status_in_system: 'converted',
  };
}

/**
 * Apply the first matching active rule to an email document.
 * Returns a patch object to merge into the upsert $set.
 * assign_to creates a Task and links the email (converted).
 */
export async function applyRoutingRulesToEmail(emailDoc, rules) {
  const activeRules = Array.isArray(rules)
    ? rules.filter((rule) => rule.is_active)
    : [];

  for (const rule of activeRules) {
    if (!matchesCondition(rule, emailDoc)) continue;

    if (rule.action_type === 'assign_to') {
      return applyAssignToAction(emailDoc, rule);
    }
    return applyAction(rule, emailDoc);
  }
  return {};
}

export async function loadActiveRoutingRules() {
  const rules = await listRoutingRules('order');
  return rules.filter((rule) => rule.is_active);
}
