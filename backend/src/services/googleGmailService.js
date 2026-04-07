import { google } from 'googleapis';
import { config } from '../config/index.js';

const googleConfig = config.google;

function ensureGoogleEnv() {
  if (!googleConfig.clientId || !googleConfig.clientSecret) {
    const err = new Error('Google OAuth env vars are missing');
    err.code = 'GOOGLE_OAUTH_NOT_CONFIGURED';
    throw err;
  }
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirectUri
  );
}

export function getGoogleAuthUrl(state) {
  ensureGoogleEnv();
  const oauthClient = createOAuthClient();
  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: googleConfig.scopes,
    state,
  });
}

export async function exchangeGoogleCode(code) {
  ensureGoogleEnv();
  const body = new URLSearchParams({
    client_id: googleConfig.clientId,
    client_secret: googleConfig.clientSecret,
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: googleConfig.redirectUri,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error_description || data?.error || `Google token exchange failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresOn: new Date(Date.now() + Number(data.expires_in || 3600) * 1000),
  };
}

export async function refreshGoogleAccessToken(refreshToken) {
  ensureGoogleEnv();
  if (!refreshToken) {
    const err = new Error('Missing Google refresh token');
    err.code = 'MISSING_REFRESH_TOKEN';
    throw err;
  }

  const body = new URLSearchParams({
    client_id: googleConfig.clientId,
    client_secret: googleConfig.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error_description || data?.error || `Google token refresh failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresOn: new Date(Date.now() + Number(data.expires_in || 3600) * 1000),
  };
}

export async function callGoogleApi(accessToken, url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Google API request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
