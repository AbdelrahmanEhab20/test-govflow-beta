import { Notification, NotificationPreference } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

// ─── In-app notifications ───────────────────────────────────────────────────────

export async function listNotificationsForUser(userId) {
  return Notification.find(withTenant({ user_id: userId }))
    .sort({ created_date: -1 })
    .lean()
    .exec();
}

export async function markNotificationRead(id) {
  const now = nowIso();
  const updated = await Notification.findOneAndUpdate(
    withTenant({ id }),
    { $set: { is_read: true, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
  }
  return updated;
}

export async function deleteNotification(id) {
  await Notification.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

// ─── Notification preferences ───────────────────────────────────────────────────

export async function getNotificationPreferencesForUser(userId) {
  const pref = await NotificationPreference.findOne(
    withTenant({ user_id: userId }),
  ).lean();
  return pref || null;
}

export async function listNotificationPreferencesForUser(userId) {
  return NotificationPreference.find(withTenant({ user_id: userId })).lean().exec();
}

export async function updateNotificationPreference(id, patch) {
  const now = nowIso();
  const updated = await NotificationPreference.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Notification preference not found', 'NOTIFICATION_PREF_NOT_FOUND');
  }
  return updated;
}

export async function createNotificationPreference(data) {
  const now = nowIso();
  const doc = await NotificationPreference.create({
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

