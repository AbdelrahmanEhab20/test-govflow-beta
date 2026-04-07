import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from '../config/index.js';

const msConfig = config.microsoft;

const pca = new ConfidentialClientApplication({
  auth: {
    clientId: msConfig.clientId,
    authority: `https://login.microsoftonline.com/${msConfig.tenant}`,
    clientSecret: msConfig.clientSecret,
  },
});

function ensureMicrosoftEnv() {
  if (!msConfig.clientId || !msConfig.clientSecret) {
    const err = new Error('Microsoft OAuth env vars are missing');
    err.code = 'MICROSOFT_OAUTH_NOT_CONFIGURED';
    throw err;
  }
}

export async function getMicrosoftAuthUrl(state) {
  ensureMicrosoftEnv();
  return pca.getAuthCodeUrl({
    scopes: msConfig.scopes,
    redirectUri: msConfig.redirectUri,
    state,
    prompt: 'select_account',
  });
}

export async function exchangeMicrosoftCode(code) {
  ensureMicrosoftEnv();
  const body = new URLSearchParams({
    client_id: msConfig.clientId,
    client_secret: msConfig.clientSecret,
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: msConfig.redirectUri,
    scope: msConfig.scopes.join(' '),
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${msConfig.tenant}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error_description || data?.error || `Token exchange failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresOn: new Date(Date.now() + Number(data.expires_in || 3600) * 1000),
  };
}

export async function refreshMicrosoftAccessToken(refreshToken) {
  ensureMicrosoftEnv();
  if (!refreshToken) {
    const err = new Error('Missing Microsoft refresh token');
    err.code = 'MISSING_REFRESH_TOKEN';
    throw err;
  }

  const body = new URLSearchParams({
    client_id: msConfig.clientId,
    client_secret: msConfig.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: msConfig.scopes.join(' '),
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${msConfig.tenant}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error_description || data?.error || `Token refresh failed (${res.status})`);
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

export async function callGraph(accessToken, path) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
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
    const err = new Error(data?.error?.message || `Microsoft Graph request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
