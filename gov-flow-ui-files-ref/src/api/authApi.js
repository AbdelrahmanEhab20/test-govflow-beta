import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import {
  nodeRequest,
  setNodeBackendUserId,
  clearNodeBackendUserId,
  markNodeBackendSignedOut,
  isNodeBackendSignedOut,
  useNodeBackend,
} from '@/api/nodeBackendClient';

/**
 * Auth and app-level configuration API.
 *
 * For local development we:
 * - Avoid calling Base44 public-settings endpoints (return a simple config).
 * - Use the mock/Base44 client only for `me()` so we get a fake user.
 * - Implement `logout` and `redirectToLogin` as purely local behaviours,
 *   so we never navigate to `your-base44-backend-url`.
 */

export async function getAppPublicSettings() {
  if (useNodeBackend) {
    return nodeRequest('/auth/public-settings');
  }

  return {
    id: appParams.appId || 'local',
    public_settings: { auth_required: false },
  };
}

export async function getCurrentUser() {
  if (useNodeBackend) {
    if (isNodeBackendSignedOut()) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }
    const user = await nodeRequest('/auth/me');
    if (user?.id) setNodeBackendUserId(user.id);
    return user;
  }

  return base44.auth.me();
}

export async function updateMe(data) {
  if (useNodeBackend) {
    return nodeRequest('/auth/me', { method: 'PATCH', body: data });
  }

  return base44.auth.updateMe(data);
}

export async function uploadAvatar(file) {
  if (useNodeBackend) {
    const formData = new FormData();
    formData.append('avatar', file);
    const result = await nodeRequest('/auth/avatar', { method: 'POST', formData });
    return result?.avatar_url || '';
  }

  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  await base44.auth.updateMe({ avatar_url: file_url });
  return file_url;
}

export function logout(_options = {}) {
  if (useNodeBackend) {
    clearNodeBackendUserId();
    markNodeBackendSignedOut();
    // Force auth re-check and trigger login flow.
    window.location.reload();
    return;
  }

  // Base44/local sign out: clear any stored tokens and return to main page.
  try {
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
  } catch {
    // ignore storage errors in non-browser environments
  }
  window.location.href = '/Tasks';
}

export function redirectToLogin() {
  if (useNodeBackend) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return;
  }
}

export async function signIn(identifier, password = '') {
  if (!useNodeBackend) {
    return base44.auth.me();
  }
  const normalized = String(identifier || '').trim();
  if (!normalized) {
    const err = new Error('Email or user id is required');
    err.status = 400;
    throw err;
  }

  const payload = normalized.includes('@')
    ? { email: normalized.toLowerCase(), password }
    : { userId: normalized, password };

  const result = await nodeRequest('/auth/dev-login', { method: 'POST', body: payload });
  const user = result?.user || null;
  if (!user?.id) {
    const err = new Error('Invalid login response');
    err.status = 500;
    throw err;
  }

  setNodeBackendUserId(user.id);
  return user;
}

