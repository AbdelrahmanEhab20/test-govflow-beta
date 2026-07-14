import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

export const EMAIL_LIST_INITIAL = 100;
export const EMAIL_LIST_PAGE_SIZE = 50;

/**
 * Email inbox domain API.
 */

export async function listEmails(query = {}, orderBy = '-received_at', limit = 100, skip = 0) {
  if (useNodeBackend) {
    return nodeRequest('/emails', { query: { ...query, orderBy, limit, skip } });
  }
  return base44.entities.EmailMessage.filter(query, orderBy, limit);
}

export async function listEmailsPaginated(
  query = {},
  orderBy = '-received_at',
  limit = EMAIL_LIST_INITIAL,
  skip = 0,
) {
  if (useNodeBackend) {
    return nodeRequest('/emails', {
      query: { ...query, orderBy, limit, skip, paginated: 'true' },
    });
  }
  const items = await base44.entities.EmailMessage.filter(query, orderBy, limit);
  return {
    items,
    total: items.length,
    hasMore: false,
    skip,
    limit,
  };
}

export async function getEmailCounts(query = {}) {
  if (useNodeBackend) {
    return nodeRequest('/emails/counts', { query });
  }
  return { all: 0, new: 0, starred: 0, converted: 0, archived: 0 };
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

export async function syncOutlookInbox(options = {}) {
  if (useNodeBackend) {
    return nodeRequest('/auth/microsoft/sync-inbox', { method: 'POST', body: options });
  }
  return { success: false, fetched: 0, inserted: 0, updated: 0 };
}

export async function syncGmailInbox(options = {}) {
  if (useNodeBackend) {
    return nodeRequest('/auth/google/sync-inbox', { method: 'POST', body: options });
  }
  return { success: false, fetched: 0, inserted: 0, updated: 0 };
}

export async function syncMailboxInbox(provider, options = {}) {
  if (!useNodeBackend) {
    return { success: false, fetched: 0, inserted: 0, updated: 0 };
  }
  if (provider === 'gmail') {
    return syncGmailInbox(options);
  }
  return syncOutlookInbox(options);
}
