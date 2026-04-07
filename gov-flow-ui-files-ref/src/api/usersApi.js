import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * User domain API.
 */

export async function listUsers() {
  if (useNodeBackend) {
    return nodeRequest('/users');
  }
  return base44.entities.User.list();
}

export async function updateUser(userId, data) {
  if (useNodeBackend) {
    return nodeRequest(`/users/${userId}`, { method: 'PATCH', body: data });
  }
  return base44.entities.User.update(userId, data);
}

export async function updateUserRole(userId, newRole) {
  if (useNodeBackend) {
    return nodeRequest(`/users/${userId}/role`, {
      method: 'POST',
      body: { newRole },
    });
  }
  const response = await base44.functions.invoke('updateUserRole', { userId, newRole });
  return response?.data ?? response;
}

export async function inviteUser(payloadOrEmail, maybeRole) {
  const payload = typeof payloadOrEmail === 'object' && payloadOrEmail !== null
    ? payloadOrEmail
    : { email: payloadOrEmail, role: maybeRole };

  if (useNodeBackend) {
    return nodeRequest('/users/invite', { method: 'POST', body: payload });
  }
  return base44.users.inviteUser(payload.email, payload.role);
}

