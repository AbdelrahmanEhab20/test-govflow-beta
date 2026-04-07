import { v4 as uuidv4 } from 'uuid';
import { RoutingRule } from '../models/index.js';
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

export async function listRoutingRules(orderBy = 'order') {
  let query = RoutingRule.find(withTenant()).lean();
  query = applySort(query, orderBy);
  return query.exec();
}

export async function createRoutingRule(data) {
  const now = nowIso();
  const doc = await RoutingRule.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

export async function updateRoutingRule(id, patch) {
  const now = nowIso();
  const updated = await RoutingRule.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Routing rule not found', 'ROUTING_RULE_NOT_FOUND');
  }
  return updated;
}

export async function deleteRoutingRule(id) {
  await RoutingRule.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

