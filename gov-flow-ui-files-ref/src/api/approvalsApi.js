import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Task approvals and submit-for-approval flow.
 */

export async function listTaskApprovals(taskId) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${taskId}/approvals`);
  }
  return base44.entities.TaskApproval.filter({ task_id: taskId });
}

export async function submitForApproval(taskId) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${taskId}/submit-for-approval`, { method: 'POST' });
  }
  const response = await base44.functions.invoke('submitForApproval', { task_id: taskId });
  return response?.data ?? response;
}
