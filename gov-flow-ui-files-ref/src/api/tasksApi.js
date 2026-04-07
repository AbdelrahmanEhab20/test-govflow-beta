import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Task domain API.
 * For now this is a thin wrapper around Base44 entities so that
 * React components do not depend on the Base44 SDK directly.
 */

export async function listTasks({ orderBy = '-created_date', limit } = {}) {
  if (useNodeBackend) {
    return nodeRequest('/tasks', { query: { orderBy, limit } });
  }
  return base44.entities.Initiative.list(orderBy, limit);
}

export async function getTaskById(id) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${id}`);
  }
  const result = await base44.entities.Initiative.filter({ id });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function updateTask(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.Initiative.update(id, data);
}

export async function deleteTask(id) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${id}`, { method: 'DELETE' });
  }
  return base44.entities.Initiative.delete(id);
}

export async function createTask(data) {
  if (useNodeBackend) {
    return nodeRequest('/tasks', { method: 'POST', body: data });
  }
  return base44.entities.Initiative.create(data);
}

export async function listSubtasks(taskId) {
  if (useNodeBackend) {
    return nodeRequest(`/tasks/${taskId}/subtasks`);
  }
  return base44.entities.Subtask.filter({ task_id: taskId });
}

export async function listComments(entityType, entityId) {
  if (useNodeBackend) {
    return nodeRequest('/comments', { query: { entityType, entityId } });
  }
  return base44.entities.Comment.filter({ entity_type: entityType, entity_id: entityId });
}

export async function createSubtask(data) {
  if (useNodeBackend) {
    return nodeRequest('/subtasks', { method: 'POST', body: data });
  }
  return base44.entities.Subtask.create(data);
}

export async function updateSubtask(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/subtasks/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.Subtask.update(id, data);
}

export async function deleteSubtask(id) {
  if (useNodeBackend) {
    return nodeRequest(`/subtasks/${id}`, { method: 'DELETE' });
  }
  return base44.entities.Subtask.delete(id);
}

export async function createComment(data) {
  if (useNodeBackend) {
    return nodeRequest('/comments', { method: 'POST', body: data });
  }
  return base44.entities.Comment.create(data);
}

export async function listTaskDependencies(taskId) {
  if (useNodeBackend) {
    return nodeRequest('/task-dependencies', { query: { taskId } });
  }
  return base44.entities.TaskDependency.filter({ task_id: taskId });
}

/** Dependencies where this task is the dependent (prerequisites for this task). */
export async function listTaskDependenciesByDependent(dependentTaskId) {
  if (useNodeBackend) {
    return nodeRequest('/task-dependencies', { query: { dependentTaskId } });
  }
  return base44.entities.TaskDependency.filter({
    dependent_task_id: dependentTaskId,
    is_active: true,
  });
}

export async function createTaskDependency(data) {
  if (useNodeBackend) {
    return nodeRequest('/task-dependencies', { method: 'POST', body: data });
  }
  return base44.entities.TaskDependency.create(data);
}

export async function deleteTaskDependency(id) {
  if (useNodeBackend) {
    return nodeRequest(`/task-dependencies/${id}`, { method: 'DELETE' });
  }
  return base44.entities.TaskDependency.delete(id);
}

