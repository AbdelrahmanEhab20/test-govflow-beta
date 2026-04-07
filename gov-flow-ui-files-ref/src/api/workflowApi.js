import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Workflow stages / Kanban configuration API.
 */

export async function listWorkflowStages(filters = {}, orderBy = 'order') {
  if (useNodeBackend) {
    return nodeRequest('/workflow-stages', { query: { ...filters, orderBy } });
  }
  return base44.entities.WorkflowStage.filter(filters, orderBy);
}

export async function createWorkflowStage(data) {
  if (useNodeBackend) {
    return nodeRequest('/workflow-stages', { method: 'POST', body: data });
  }
  return base44.entities.WorkflowStage.create(data);
}

export async function updateWorkflowStage(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/workflow-stages/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.WorkflowStage.update(id, data);
}

export async function deleteWorkflowStage(id) {
  if (useNodeBackend) {
    return nodeRequest(`/workflow-stages/${id}`, { method: 'DELETE' });
  }
  return base44.entities.WorkflowStage.delete(id);
}

export async function bulkCreateWorkflowStages(items) {
  if (useNodeBackend) {
    return nodeRequest('/workflow-stages/bulk', { method: 'POST', body: items });
  }
  return base44.entities.WorkflowStage.bulkCreate(items);
}

