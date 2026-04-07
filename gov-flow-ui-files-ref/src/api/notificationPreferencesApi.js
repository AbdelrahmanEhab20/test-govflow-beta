import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Notification preferences per user.
 */

export async function getNotificationPreferencesForUser(userId) {
  if (useNodeBackend) {
    return nodeRequest('/notification-preferences', { query: { userId } });
  }
  const result = await base44.entities.NotificationPreference.filter({ user_id: userId });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function listNotificationPreferencesForUser(userId) {
  if (useNodeBackend) {
    return nodeRequest('/notification-preferences/list', { query: { userId } });
  }
  return base44.entities.NotificationPreference.filter({ user_id: userId });
}

export async function updateNotificationPreference(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/notification-preferences/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.NotificationPreference.update(id, data);
}

export async function createNotificationPreference(data) {
  if (useNodeBackend) {
    return nodeRequest('/notification-preferences', { method: 'POST', body: data });
  }
  return base44.entities.NotificationPreference.create(data);
}
