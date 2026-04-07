const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const useNodeBackend =
  import.meta.env.VITE_USE_NODE_BACKEND === 'true' ||
  Boolean(apiBaseUrl);

const DEV_USER_KEY = 'govflow_dev_user_id';
const SIGNED_OUT_KEY = 'govflow_signed_out';

function readDevUserId() {
  try {
    if (localStorage.getItem(SIGNED_OUT_KEY) === 'true') {
      return null;
    }
    return (
      localStorage.getItem(DEV_USER_KEY) ||
      import.meta.env.VITE_DEV_USER_ID ||
      'user1'
    );
  } catch {
    return import.meta.env.VITE_DEV_USER_ID || 'user1';
  }
}

let currentUserId = readDevUserId();

export function setNodeBackendUserId(userId) {
  if (!userId) return;
  currentUserId = userId;
  try {
    localStorage.setItem(DEV_USER_KEY, userId);
    localStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Ignore non-browser storage errors.
  }
}

export function clearNodeBackendUserId() {
  currentUserId = null;
  try {
    localStorage.removeItem(DEV_USER_KEY);
  } catch {
    // Ignore non-browser storage errors.
  }
}

export function markNodeBackendSignedOut() {
  currentUserId = null;
  try {
    localStorage.setItem(SIGNED_OUT_KEY, 'true');
    localStorage.removeItem(DEV_USER_KEY);
  } catch {
    // Ignore non-browser storage errors.
  }
}

export function isNodeBackendSignedOut() {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

function buildUrl(path, query) {
  const url = new URL(path, apiBaseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function nodeRequest(path, { method = 'GET', query, body, headers = {}, formData } = {}) {
  const requestHeaders = { ...headers };
  if (currentUserId) {
    requestHeaders['X-User-Id'] = currentUserId;
  }

  let payload = undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: requestHeaders,
    body: payload,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

