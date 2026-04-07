import { logger } from '../lib/logger.js';

/**
 * Send a consistent error JSON shape:
 * { success: false, error: { code, message } }
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (status >= 500) {
    logger.error(message, { path: req.path, stack: err.stack });
  } else {
    logger.warn(message, { path: req.path, code });
  }

  res.status(status).json({ success: false, error: { code, message } });
}

/**
 * Wrap async route handlers so thrown errors reach errorHandler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create an HTTP error with a status code and optional code string.
 */
export function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}
