import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

export async function getOutlookStatus() {
  if (!useNodeBackend) {
    return { connected: false, mailbox: null };
  }
  return nodeRequest('/auth/microsoft/status');
}

export async function startOutlookConnect(returnTo = '/EmailInbox') {
  if (!useNodeBackend) {
    throw new Error('Outlook connect is only available in node backend mode');
  }
  const data = await nodeRequest('/auth/microsoft/authorize-url', {
    method: 'POST',
    body: { returnTo },
  });
  if (!data?.url) {
    throw new Error('Microsoft OAuth URL was not returned by backend');
  }
  window.location.assign(data.url);
}

export async function listOutlookContacts() {
  if (!useNodeBackend) {
    return { value: [] };
  }
  return nodeRequest('/auth/microsoft/contacts');
}

export async function listOutlookInbox() {
  if (!useNodeBackend) {
    return { value: [] };
  }
  return nodeRequest('/auth/microsoft/inbox');
}
