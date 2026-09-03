import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

function parseCorsOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function assertValidUrl(name, value) {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL, received "${value}"`);
  }
}

function assertEmailFrom(value) {
  const emailFrom = String(value || '').trim();
  const hasAngleBracketEmail = /<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>$/.test(emailFrom);
  const hasPlainEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailFrom);
  if (!hasAngleBracketEmail && !hasPlainEmail) {
    throw new Error(`EMAIL_FROM must be a valid sender address, received "${emailFrom}"`);
  }
}

function validateProductionEnv() {
  if (!isProduction) return;

  const requiredVars = [
    'JWT_SECRET',
    'APP_URL',
    'SENDGRID_API_KEY',
    'SENDGRID_INVITE_TEMPLATE_ID',
    'SENDGRID_RESET_TEMPLATE_ID',
    'EMAIL_FROM',
    'FRONTEND_URL',
    'CORS_ORIGINS',
  ];

  const missing = requiredVars.filter((name) => !String(process.env[name] || '').trim());
  if (missing.length > 0) {
    throw new Error(`Missing required production env vars: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET === 'govflow-dev-secret') {
    throw new Error('JWT_SECRET must not use the default development secret in production');
  }

  assertValidUrl('APP_URL', process.env.APP_URL);
  assertValidUrl('FRONTEND_URL', process.env.FRONTEND_URL);

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one allowed origin in production');
  }
  corsOrigins.forEach((origin) => assertValidUrl('CORS_ORIGINS entry', origin));
  assertEmailFrom(process.env.EMAIL_FROM);
}

validateProductionEnv();

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/govflow_dev',
  jwtSecret: process.env.JWT_SECRET || 'govflow-dev-secret',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  emailFrom: process.env.EMAIL_FROM || 'GovFlow <onboarding@govflow.local>',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    inviteTemplateId: process.env.SENDGRID_INVITE_TEMPLATE_ID || '',
    resetTemplateId: process.env.SENDGRID_RESET_TEMPLATE_ID || '',
  },
  branding: {
    appName: process.env.BRAND_APP_NAME || 'GovFlow',
    companyName: process.env.BRAND_COMPANY_NAME || 'GovFlow',
    logoUrl: process.env.BRAND_LOGO_URL || '/logo.svg',
    faviconUrl: process.env.BRAND_FAVICON_URL || '/favicon.svg',
    primaryColor: process.env.BRAND_PRIMARY_COLOR || '#2563eb',
    secondaryColor: process.env.BRAND_SECONDARY_COLOR || '#0f172a',
    accentColor: process.env.BRAND_ACCENT_COLOR || '#6366f1',
    sidebarTitle: process.env.BRAND_SIDEBAR_TITLE || process.env.BRAND_COMPANY_NAME || 'GovFlow',
    tagline: process.env.BRAND_TAGLINE || 'Workflow System',
    supportEmail: process.env.BRAND_SUPPORT_EMAIL || 'support@govflow.local',
    websiteUrl: process.env.BRAND_WEBSITE_URL || 'https://govflow.local',
    showGovflowCredit: process.env.BRAND_SHOW_GOVFLOW_CREDIT !== 'false',
    govflowCreditText: process.env.BRAND_GOVFLOW_CREDIT_TEXT || 'Powered by GovFlow',
    govflowCreditUrl: process.env.BRAND_GOVFLOW_CREDIT_URL || 'https://govflow.ai',
    // Bootstrap only — Mongo TenantSettings.branding overrides after Settings save
    envLabel: process.env.BRAND_ENV_LABEL || 'beta',
  },
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production',
  allowLegacyUserHeader: process.env.ALLOW_LEGACY_X_USER_ID === 'true' || process.env.NODE_ENV !== 'production',
  defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  uploadsMaxSize: Number(process.env.UPLOADS_MAX_SIZE) || 5 * 1024 * 1024,
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    bucket: String(process.env.S3_BUCKET || '').trim(),
    region: process.env.S3_REGION || 'auto',
    endpoint: String(process.env.S3_ENDPOINT || '').trim().replace(/\/$/, ''),
    accessKeyId: String(process.env.S3_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: String(process.env.S3_SECRET_ACCESS_KEY || '').trim(),
    publicBaseUrl: String(process.env.S3_PUBLIC_BASE_URL || '').trim().replace(/\/$/, ''),
  },
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173'),
  sessionSecret: process.env.SESSION_SECRET || 'govflow-dev-session-secret',
  frontendUrl: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173',
  auth: {
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    inviteTokenMinutes: Number(process.env.INVITE_TOKEN_MINUTES) || 60 * 24 * 7,
    resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES) || 30,
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenant: process.env.MICROSOFT_TENANT || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/auth/microsoft/callback',
    scopes: (process.env.MICROSOFT_GRAPH_SCOPES || 'offline_access User.Read Mail.Read Contacts.Read')
      .split(' ')
      .map((scope) => scope.trim())
      .filter(Boolean),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback',
    scopes: (process.env.GOOGLE_GMAIL_SCOPES || 'openid email profile https://www.googleapis.com/auth/gmail.readonly')
      .split(' ')
      .map((scope) => scope.trim())
      .filter(Boolean),
  },
};
