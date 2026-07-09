import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationPreference, User } from '../models/index.js';
import { config } from '../config/index.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Notify admins/editors when a routing rule is created or updated.
 */
export async function notifyRoutingRuleChanged({ rule, eventType, actorUserId }) {
  if (!rule?.id) return;

  const recipients = await User.find(
    withTenant({ role: { $in: ['admin', 'department_admin', 'editor'] } }),
  )
    .select('id')
    .lean()
    .exec();

  const title =
    eventType === 'created' ? 'Routing rule created' : 'Routing rule updated';
  const message = `${title}: ${rule.name || 'Unnamed rule'}`;

  for (const user of recipients) {
    if (user.id === actorUserId) continue;

    const pref = await NotificationPreference.findOne(
      withTenant({ user_id: user.id }),
    ).lean();
    if (pref && pref.notify_routing_rule_changes === false) continue;

    await Notification.create({
      id: uuidv4(),
      tenantId: config.defaultTenantId,
      user_id: user.id,
      title,
      message,
      type: 'routing_rule_change',
      is_read: false,
      created_date: nowIso(),
      updated_date: nowIso(),
    });
  }
}
