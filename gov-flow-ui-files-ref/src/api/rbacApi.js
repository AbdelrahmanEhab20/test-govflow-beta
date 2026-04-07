import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * RBAC: role page access and role permissions.
 */

export async function listRolePageAccess(orderBy = 'order') {
  if (useNodeBackend) {
    return nodeRequest('/role-page-access', { query: { orderBy } });
  }
  return base44.entities.RolePageAccess.list(orderBy);
}

export async function updateRolePageAccess(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/role-page-access/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.RolePageAccess.update(id, data);
}

export async function createRolePageAccess(data) {
  if (useNodeBackend) {
    return nodeRequest('/role-page-access', { method: 'POST', body: data });
  }
  return base44.entities.RolePageAccess.create(data);
}

export async function listRolePermissions() {
  if (useNodeBackend) {
    return nodeRequest('/role-permissions');
  }
  return base44.entities.RolePermission.list();
}

export async function updateRolePermission(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/role-permissions/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.RolePermission.update(id, data);
}

export async function createRolePermission(data) {
  if (useNodeBackend) {
    return nodeRequest('/role-permissions', { method: 'POST', body: data });
  }
  return base44.entities.RolePermission.create(data);
}
