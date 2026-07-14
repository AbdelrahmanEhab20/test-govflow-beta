import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Departments and teams domain API.
 */

export async function listDepartments() {
  if (useNodeBackend) {
    return nodeRequest('/departments');
  }
  return base44.entities.Department.list();
}

export async function listTeams() {
  if (useNodeBackend) {
    return nodeRequest('/teams');
  }
  return base44.entities.Teams.list();
}

export async function createDepartment(data) {
  if (useNodeBackend) {
    return nodeRequest('/departments', { method: 'POST', body: data });
  }
  return base44.entities.Department.create(data);
}

export async function updateDepartment(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/departments/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.Department.update(id, data);
}

export async function moveDepartmentInHierarchy(departmentId, parentDepartmentId, sortIndex) {
  if (useNodeBackend) {
    return nodeRequest('/departments/hierarchy-move', {
      method: 'POST',
      body: {
        department_id: departmentId,
        parent_department_id: parentDepartmentId || null,
        sort_index: sortIndex,
      },
    });
  }
  throw new Error('Hierarchy move is only supported with the Node backend');
}

export async function clearDepartmentDetails(id) {
  if (useNodeBackend) {
    return nodeRequest(`/departments/${id}/clear`, { method: 'PATCH' });
  }
  throw new Error('Clear department is only supported with the Node backend');
}

export async function deleteDepartment(id) {
  if (useNodeBackend) {
    return nodeRequest(`/departments/${id}`, { method: 'DELETE' });
  }
  return base44.entities.Department.delete(id);
}

export async function updateTeam(memberId, data) {
  if (useNodeBackend) {
    return nodeRequest(`/teams/${memberId}`, { method: 'PATCH', body: data });
  }
  return base44.entities.Teams.update(memberId, data);
}

