import { asyncHandler, createHttpError } from './errorHandler.js';
import { User } from '../models/index.js';
import { config } from '../config/index.js';
import { verifyAccessToken } from '../services/authService.js';

function getLegacyUserId(req) {
  if (!config.allowLegacyUserHeader) return null;
  const headerId = req.header('X-User-Id') || req.header('x-user-id');
  if (headerId) {
    return headerId.trim();
  }
  return null;
}

function getBearerToken(req) {
  const auth = req.header('Authorization') || req.header('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

/**
 * Attaches `req.user` if a valid user can be resolved from the request.
 * Does NOT throw on missing/invalid user; use `requireAuth` for that.
 */
export const attachUser = asyncHandler(async (req, _res, next) => {
  let userId = null;
  const token = getBearerToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    userId = payload?.sub ? String(payload.sub) : null;
  }

  if (!userId) {
    userId = getLegacyUserId(req);
  }
  if (!userId) {
    req.user = null;
    return next();
  }

  const user = await User.findOne({ id: userId }).lean();
  req.user = user || null;
  return next();
});

/**
 * Require an authenticated user, otherwise respond 401 AUTH_REQUIRED.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  if (!req.user) {
    throw createHttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }
  next();
});

/**
 * Require that the current user has one of the allowed roles.
 * Usage: app.get('/admin', requireRole('admin'), handler)
 */
export function requireRole(...allowedRoles) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required', 'AUTH_REQUIRED');
    }
    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }
    const userRole = req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw createHttpError(403, 'Forbidden', 'FORBIDDEN');
    }
    next();
  });
}

