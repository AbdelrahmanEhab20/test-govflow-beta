import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Email inbox domain API.
 * Currently forwards to Base44 entities; later this can be swapped
 * to a custom backend without touching the UI.
 */

export async function listEmails(query = {}, orderBy = '-received_at', limit = 100) {
  if (useNodeBackend) {
    return nodeRequest('/emails', { query: { ...query, orderBy, limit } });
  }
  return base44.entities.EmailMessage.filter(query, orderBy, limit);
}

export async function getEmailById(id) {
  if (useNodeBackend) {
    return nodeRequest(`/emails/${id}`);
  }
  const result = await base44.entities.EmailMessage.filter({ id });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function updateEmail(id, data) {
  if (useNodeBackend) {
    return nodeRequest(`/emails/${id}`, { method: 'PATCH', body: data });
  }
  return base44.entities.EmailMessage.update(id, data);
}

export async function syncOutlookInbox() {
  if (useNodeBackend) {
    return nodeRequest('/auth/microsoft/sync-inbox', { method: 'POST' });
  }
  return { success: false, fetched: 0, inserted: 0, updated: 0 };
}

export async function syncGmailInbox() {
  if (useNodeBackend) {
    return nodeRequest('/auth/google/sync-inbox', { method: 'POST' });
  }
  return { success: false, fetched: 0, inserted: 0, updated: 0 };
}

export async function syncMailboxInbox(provider) {
  if (!useNodeBackend) {
    return { success: false, fetched: 0, inserted: 0, updated: 0 };
  }
  if (provider === 'gmail') {
    return syncGmailInbox();
  }
  return syncOutlookInbox();
}

