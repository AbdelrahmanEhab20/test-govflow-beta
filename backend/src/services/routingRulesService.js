import { v4 as uuidv4 } from 'uuid';
import { RoutingRule } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { notifyRoutingRuleChanged } from './routingRuleNotifications.js';

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

export async function createRoutingRule(data, { actorUserId } = {}) {
  const now = nowIso();
  const doc = await RoutingRule.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  const created = doc.toObject();
  await notifyRoutingRuleChanged({
    rule: created,
    eventType: 'created',
    actorUserId,
  });
  return created;
}

export async function updateRoutingRule(id, patch, { actorUserId } = {}) {
  const now = nowIso();
  const updated = await RoutingRule.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Routing rule not found', 'ROUTING_RULE_NOT_FOUND');
  }

  const patchKeys = Object.keys(patch).filter((key) => key !== 'updated_date');
  const isToggleOnly = patchKeys.length === 1 && patchKeys[0] === 'is_active';
  if (!isToggleOnly) {
    await notifyRoutingRuleChanged({
      rule: updated,
      eventType: 'updated',
      actorUserId,
    });
  }

  return updated;
}

export async function reorderRoutingRules(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw createHttpError(400, 'orderedIds must be a non-empty array', 'INVALID_REORDER');
  }

  const now = nowIso();
  await Promise.all(
    orderedIds.map((id, index) =>
      RoutingRule.findOneAndUpdate(
        withTenant({ id }),
        { $set: { order: index, updated_date: now } },
      ),
    ),
  );

  return listRoutingRules('order');
}

export async function deleteRoutingRule(id) {
  await RoutingRule.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

