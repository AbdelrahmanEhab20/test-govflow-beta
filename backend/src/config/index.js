import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/govflow_dev',
  jwtSecret: process.env.JWT_SECRET || 'govflow-dev-secret',
  defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()),
  sessionSecret: process.env.SESSION_SECRET || 'govflow-dev-session-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
