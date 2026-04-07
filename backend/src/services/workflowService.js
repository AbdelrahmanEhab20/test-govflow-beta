import { v4 as uuidv4 } from 'uuid';
import { WorkflowStage } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

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

export async function listWorkflowStages(filters = {}, orderBy = 'order') {
  const cleanFilters = {};
  for (const [k, v] of Object.entries(filters || {})) {
    if (v !== undefined && v !== null && v !== '') {
      cleanFilters[k] = v;
    }
  }

  let query = WorkflowStage.find(withTenant(cleanFilters)).lean();
  query = applySort(query, orderBy);
  return query.exec();
}

export async function createWorkflowStage(data) {
  const now = nowIso();
  const doc = await WorkflowStage.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

export async function updateWorkflowStage(id, patch) {
  const now = nowIso();
  const updated = await WorkflowStage.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Workflow stage not found', 'WORKFLOW_STAGE_NOT_FOUND');
  }
  return updated;
}

export async function deleteWorkflowStage(id) {
  await WorkflowStage.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

export async function bulkCreateWorkflowStages(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const now = nowIso();
  const docs = items.map((item) => ({
    id: item.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: item.created_date || now,
    updated_date: item.updated_date || now,
    ...item,
  }));
  const inserted = await WorkflowStage.insertMany(docs);
  return inserted.map((d) => d.toObject());
}

