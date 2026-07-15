const ALLOWED_RETURN_PATHS = new Set([
  '/EmailInbox',
  '/Settings',
]);

export function normalizeOAuthReturnPath(returnTo) {
  const fallback = '/EmailInbox';
  if (!returnTo || typeof returnTo !== 'string') return fallback;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  const pathOnly = trimmed.split('?')[0] || fallback;
  if (!ALLOWED_RETURN_PATHS.has(pathOnly)) return fallback;
  return pathOnly;
}

export function buildOAuthRedirectUrl({ frontendUrl, returnPath, params = {} }) {
  const redirectUrl = new URL(normalizeOAuthReturnPath(returnPath), frontendUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      redirectUrl.searchParams.set(key, String(value));
    }
  });
  return redirectUrl.toString();
}
