import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Routing rules domain API.
 */

export async function listRoutingRules(orderBy = 'order') {
  if (useNodeBackend) {
    return nodeRequest('/routing-rules', { query: { orderBy } });
  }
  return base44.entities.RoutingRule.list(orderBy);
}

export async function createRoutingRule(data) {
  if (useNodeBackend) {
    return nodeRequest('/routing-rules', { method: 'POST', body: data });
  }
  return base44.entities.RoutingRule.create(data);
}

export async function updateRoutingRule(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/routing-rules/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.RoutingRule.update(id, data);
}

export async function deleteRoutingRule(id) {
  if (useNodeBackend) {
    return nodeRequest(`/routing-rules/${id}`, { method: 'DELETE' });
  }
  return base44.entities.RoutingRule.delete(id);
}
