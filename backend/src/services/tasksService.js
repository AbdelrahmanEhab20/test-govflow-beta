import { v4 as uuidv4 } from 'uuid';
import { Task, Subtask, Comment, TaskDependency } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { notifyAssigneeTaskAssigned } from './taskAssignmentNotifications.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function applySort(query, orderBy) {
  if (!orderBy || typeof orderBy !== 'string') return query;
  const desc = orderBy.startsWith('-');
  const field = desc ? orderBy.slice(1) : orderBy;
  if (!field) return query;
  return query.sort({ [field]: desc ? -1 : 1 });
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Tasks ──────────────────────────────────────────────────────────────────────

export async function listTasks({ orderBy = '-created_date', limit } = {}) {
  let query = Task.find(withTenant()).lean();
  query = applySort(query, orderBy);
  if (limit) {
    const n = Number(limit);
    if (!Number.isNaN(n) && n > 0) {
      query = query.limit(n);
    }
  }
  return query.exec();
}

export async function getTaskById(id) {
  const task = await Task.findOne(withTenant({ id })).lean();
  if (!task) {
    throw createHttpError(404, 'Task not found', 'TASK_NOT_FOUND');
  }
  return task;
}

export async function createTask(data) {
  const now = nowIso();
  const doc = await Task.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  const created = doc.toObject();
  if (created.lead_user_id) {
    await notifyAssigneeTaskAssigned({
      task: created,
      previousLeadUserId: null,
    });
  }
  return created;
}

export async function updateTask(id, patch) {
  const now = nowIso();
  const existing = await Task.findOne(withTenant({ id })).lean();
  if (!existing) {
    throw createHttpError(404, 'Task not found', 'TASK_NOT_FOUND');
  }
  const previousLeadUserId = existing.lead_user_id;

  const updated = await Task.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  const newLead = updated.lead_user_id;
  if (newLead && newLead !== previousLeadUserId) {
    await notifyAssigneeTaskAssigned({
      task: updated,
      previousLeadUserId,
    });
  }

  return updated;
}

export async function deleteTask(id) {
  await Task.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

// ─── Subtasks ───────────────────────────────────────────────────────────────────

export async function listSubtasks(taskId) {
  return Subtask.find(withTenant({ task_id: taskId })).lean().exec();
}

export async function createSubtask(data) {
  const now = nowIso();
  const doc = await Subtask.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

export async function updateSubtask(id, patch) {
  const now = nowIso();
  const updated = await Subtask.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Subtask not found', 'SUBTASK_NOT_FOUND');
  }
  return updated;
}

export async function deleteSubtask(id) {
  await Subtask.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

// ─── Comments ───────────────────────────────────────────────────────────────────

export async function listComments(entityType, entityId) {
  return Comment.find(
    withTenant({ entity_type: entityType, entity_id: entityId }),
  )
    .sort({ created_date: -1 })
    .lean()
    .exec();
}

export async function createComment(data) {
  const now = nowIso();
  const doc = await Comment.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

// ─── Task dependencies ──────────────────────────────────────────────────────────

export async function listTaskDependenciesByPrerequisite(taskId) {
  return TaskDependency.find(
    withTenant({ prerequisite_task_id: taskId }),
  )
    .lean()
    .exec();
}

export async function listTaskDependenciesByDependent(dependentTaskId) {
  return TaskDependency.find(
    withTenant({ dependent_task_id: dependentTaskId, is_active: true }),
  )
    .lean()
    .exec();
}

export async function createTaskDependency(data) {
  const now = nowIso();
  const doc = await TaskDependency.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    is_active: data.is_active ?? true,
    ...data,
  });
  return doc.toObject();
}

export async function deleteTaskDependency(id) {
  await TaskDependency.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

