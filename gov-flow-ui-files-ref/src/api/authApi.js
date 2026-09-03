import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import {
  nodeRequest,
  setNodeBackendAuthToken,
  clearNodeBackendAuthToken,
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

export async function updateBranding(data) {
  if (!useNodeBackend) {
    throw new Error('Branding updates require node backend mode');
  }
  return nodeRequest('/auth/branding', { method: 'PATCH', body: data });
}

export async function uploadBrandLogo(file) {
  if (!useNodeBackend) {
    throw new Error('Brand logo upload requires node backend mode');
  }
  const formData = new FormData();
  formData.append('avatar', file);
  return nodeRequest('/auth/branding/logo', { method: 'POST', formData });
}

export async function getCurrentUser() {
  if (useNodeBackend) {
    if (isNodeBackendSignedOut()) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }
    return nodeRequest('/auth/me');
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
    clearNodeBackendAuthToken();
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
  const email = String(identifier || '').trim().toLowerCase();
  if (!email) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  const result = await nodeRequest('/auth/login', { method: 'POST', body: { email, password } });
  const user = result?.user || null;
  const token = result?.token || null;
  if (!user?.id) {
    const err = new Error('Invalid login response');
    err.status = 500;
    throw err;
  }
  if (!token) {
    const err = new Error('Missing access token');
    err.status = 500;
    throw err;
  }

  setNodeBackendAuthToken(token);
  return user;
}

export async function acceptInvite(token, password) {
  const result = await nodeRequest(`/auth/accept-invite/${encodeURIComponent(token)}`, {
    method: 'POST',
    body: { password },
  });
  if (result?.token) {
    setNodeBackendAuthToken(result.token);
  }
  return result;
}

export async function forgotPassword(email) {
  return nodeRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase() },
  });
}

export async function resetPassword(token, password) {
  const result = await nodeRequest(`/auth/reset-password/${encodeURIComponent(token)}`, {
    method: 'POST',
    body: { password },
  });
  if (result?.token) {
    setNodeBackendAuthToken(result.token);
  }
  return result;
}

