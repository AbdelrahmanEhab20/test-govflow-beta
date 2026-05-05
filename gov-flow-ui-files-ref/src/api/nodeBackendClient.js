const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const useNodeBackend =
  import.meta.env.VITE_USE_NODE_BACKEND === 'true' ||
  Boolean(apiBaseUrl);

const AUTH_TOKEN_KEY = 'govflow_auth_token';
const SIGNED_OUT_KEY = 'govflow_signed_out';

function readAuthToken() {
  try {
    if (localStorage.getItem(SIGNED_OUT_KEY) === 'true') {
      return null;
    }
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

let currentAuthToken = readAuthToken();

export function setNodeBackendAuthToken(token) {
  if (!token) return;
  currentAuthToken = token;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Ignore non-browser storage errors.
  }
}

export function clearNodeBackendAuthToken() {
  currentAuthToken = null;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore non-browser storage errors.
  }
}

export function markNodeBackendSignedOut() {
  currentAuthToken = null;
  try {
    localStorage.setItem(SIGNED_OUT_KEY, 'true');
    localStorage.removeItem(AUTH_TOKEN_KEY);
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
  if (currentAuthToken) {
    requestHeaders.Authorization = `Bearer ${currentAuthToken}`;
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
    const errorCode = data?.error?.code || data?.code || null;
    if (res.status === 401 && errorCode === 'INVALID_TOKEN') {
      clearNodeBackendAuthToken();
    }
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

