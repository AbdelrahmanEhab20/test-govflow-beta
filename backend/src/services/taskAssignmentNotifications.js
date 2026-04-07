import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationPreference } from '../models/index.js';
import { config } from '../config/index.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Create an in-app notification when a user becomes the lead assignee on a task.
 * Respects NotificationPreference.notify_task_assigned (defaults to true when no row exists).
 */
export async function notifyAssigneeTaskAssigned({ task, previousLeadUserId }) {
  const assigneeId = task?.lead_user_id;
  if (!assigneeId) return;
  if (previousLeadUserId === assigneeId) return;

  const pref = await NotificationPreference.findOne(withTenant({ user_id: assigneeId })).lean();
  if (pref && pref.notify_task_assigned === false) return;

  const title = 'New task assigned';
  const message = `You were assigned: ${task.pillar || 'Task'}`;

  await Notification.create({
    id: uuidv4(),
    tenantId: config.defaultTenantId,
    user_id: assigneeId,
    title,
    message,
    type: 'assignment',
    related_task_id: task.id,
    related_email_id: task.source_email_id || undefined,
    is_read: false,
    created_date: nowIso(),
    updated_date: nowIso(),
  });
}
