import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Notifications domain API.
 */

export async function listNotificationsForUser(userId) {
  if (useNodeBackend) {
    return nodeRequest('/notifications', { query: { userId } });
  }
  return base44.entities.Notification.filter(
    { user_id: userId },
    '-created_date',
  );
}

export async function markNotificationRead(id) {
  if (useNodeBackend) {
    return nodeRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  }
  return base44.entities.Notification.update(id, { is_read: true });
}

export async function deleteNotification(id) {
  if (useNodeBackend) {
    return nodeRequest(`/notifications/${id}`, { method: 'DELETE' });
  }
  return base44.entities.Notification.delete(id);
}

