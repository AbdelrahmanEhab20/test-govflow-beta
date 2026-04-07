import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;

function getResendClient() {
  if (!config.resendApiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw createHttpError(500, 'RESEND_API_KEY is not configured', 'RESEND_NOT_CONFIGURED');
    }
    return null;
  }
  return new Resend(config.resendApiKey);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(plainText, hashed) {
  if (!plainText || !hashed) return false;
  return bcrypt.compare(plainText, hashed);
}

export function ensureStrongPassword(password) {
  const value = String(password || '');
  if (value.length < 8) {
    throw createHttpError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  }
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, tenantId: user.tenantId || config.defaultTenantId },
    config.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    throw createHttpError(401, 'Invalid or expired access token', 'INVALID_TOKEN');
  }
}

export function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function tokenExpiry(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function sendInviteEmail(email, token) {
  const resend = getResendClient();
  const inviteUrl = `${config.appUrl.replace(/\/$/, '')}/accept-invite/${encodeURIComponent(token)}`;
  if (!resend) {
    logger.info('Invite URL generated (email skipped in local mode)', { email, inviteUrl });
    return;
  }
  await resend.emails.send({
    from: config.emailFrom,
    to: [email],
    subject: 'GovFlow invitation',
    html: `<p>You have been invited to GovFlow.</p><p><a href="${inviteUrl}">Set your password</a></p>`,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resend = getResendClient();
  const resetUrl = `${config.appUrl.replace(/\/$/, '')}/reset-password/${encodeURIComponent(token)}`;
  if (!resend) {
    logger.info('Reset URL generated (email skipped in local mode)', { email, resetUrl });
    return;
  }
  await resend.emails.send({
    from: config.emailFrom,
    to: [email],
    subject: 'GovFlow password reset',
    html: `<p>Use this link to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}
