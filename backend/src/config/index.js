import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/govflow_dev',
  jwtSecret: process.env.JWT_SECRET || 'govflow-dev-secret',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'GovFlow <onboarding@govflow.local>',
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
  },
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production',
  allowLegacyUserHeader: process.env.ALLOW_LEGACY_X_USER_ID === 'true' || process.env.NODE_ENV !== 'production',
  defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()),
  sessionSecret: process.env.SESSION_SECRET || 'govflow-dev-session-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
