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
 * Notify a user when their department assignment changes.
 */
export async function notifyUserDepartmentChange({
  userId,
  previousDepartmentName,
  newDepartmentName,
  actorUserId,
}) {
  if (!userId) return;

  const prev = String(previousDepartmentName || '').trim();
  const next = String(newDepartmentName || '').trim();
  if (prev === next) return;

  const pref = await NotificationPreference.findOne(withTenant({ user_id: userId })).lean();
  if (pref && pref.notify_profile_updated === false) return;

  const actor = actorUserId
    ? await User.findOne(withTenant({ id: actorUserId })).select('full_name').lean()
    : null;
  const actorName = actor?.full_name || 'An administrator';

  let title;
  let message;
  if (!next && prev) {
    title = 'Removed from department';
    message = `You were removed from ${prev} by ${actorName}.`;
  } else if (next && prev) {
    title = 'Department updated';
    message = `You were moved from ${prev} to ${next} by ${actorName}.`;
  } else if (next && !prev) {
    title = 'Department updated';
    message = `You were assigned to ${next} by ${actorName}.`;
  } else {
    return;
  }

  await Notification.create({
    id: uuidv4(),
    tenantId: config.defaultTenantId,
    user_id: userId,
    title,
    message,
    type: 'department_change',
    is_read: false,
    created_date: nowIso(),
    updated_date: nowIso(),
  });
}
