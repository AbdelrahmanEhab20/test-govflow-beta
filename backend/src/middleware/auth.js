import { asyncHandler, createHttpError } from './errorHandler.js';
import { User } from '../models/index.js';
import { config } from '../config/index.js';

function getUserIdFromRequest(req) {
  // Simple dev strategy: either X-User-Id header or Bearer <userId>
  const headerId = req.header('X-User-Id') || req.header('x-user-id');
  if (headerId) return headerId.trim();

  const auth = req.header('Authorization') || req.header('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

/**
 * Attaches `req.user` if a valid user can be resolved from the request.
 * Does NOT throw on missing/invalid user; use `requireAuth` for that.
 */
export const attachUser = asyncHandler(async (req, _res, next) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    req.user = null;
    return next();
  }

  let user = await User.findOne({ id: userId }).lean();

  // Dev convenience: optionally auto-create a basic user if not found.
  if (!user && process.env.AUTO_CREATE_DEV_USER === 'true') {
    const now = new Date().toISOString();
    const doc = await User.create({
      id: userId,
      tenantId: config.defaultTenantId,
      full_name: `Dev User ${userId}`,
      email: `${userId}@local.test`,
      role: 'admin',
      created_date: now,
      updated_date: now,
    });
    user = doc.toObject();
  }

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

