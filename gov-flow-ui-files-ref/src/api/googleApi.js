import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

export async function getGmailStatus() {
  if (!useNodeBackend) {
    return { connected: false, mailbox: null };
  }
  return nodeRequest('/auth/google/status');
}

export async function startGmailConnect() {
  if (!useNodeBackend) {
    throw new Error('Gmail connect is only available in node backend mode');
  }
  const data = await nodeRequest('/auth/google/authorize-url', { method: 'POST' });
  if (!data?.url) {
    throw new Error('Google OAuth URL was not returned by backend');
  }
  window.location.assign(data.url);
}
