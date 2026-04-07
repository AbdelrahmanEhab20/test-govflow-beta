import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendgridMail from '@sendgrid/mail';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;

function getSendgridClient() {
  if (!config.sendgrid.apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw createHttpError(500, 'SENDGRID_API_KEY is not configured', 'SENDGRID_NOT_CONFIGURED');
    }
    return null;
  }
  sendgridMail.setApiKey(config.sendgrid.apiKey);
  return sendgridMail;
}

function getPublicAppBaseUrl() {
  return String(config.frontendUrl || config.appUrl || '').replace(/\/$/, '');
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
  const sendgrid = getSendgridClient();
  const inviteUrl = `${getPublicAppBaseUrl()}/accept-invite/${encodeURIComponent(token)}`;
  if (!sendgrid) {
    logger.info('Invite URL generated (email skipped in local mode)', { email, inviteUrl });
    return { messageQueued: false, providerId: null };
  }
  if (!config.sendgrid.inviteTemplateId) {
    throw createHttpError(500, 'SENDGRID_INVITE_TEMPLATE_ID is not configured', 'SENDGRID_TEMPLATE_NOT_CONFIGURED');
  }
  let response;
  try {
    response = await sendgrid.send({
      from: config.emailFrom,
      to: email,
      templateId: config.sendgrid.inviteTemplateId,
      dynamicTemplateData: {
        invite_url: inviteUrl,
        app_name: config.branding.appName,
        support_email: config.branding.supportEmail,
      },
    });
  } catch (error) {
    logger.error('Invite email transport error', {
      email,
      provider: 'sendgrid',
      providerError: error?.response?.body || error?.message || String(error),
    });
    throw createHttpError(502, 'Invite email delivery failed', 'INVITE_EMAIL_DELIVERY_FAILED');
  }

  const firstResponse = Array.isArray(response) ? response[0] : response;
  const providerId = firstResponse?.headers?.['x-message-id'] || firstResponse?.headers?.['X-Message-Id'] || null;
  logger.info('Invite email queued', {
    email,
    provider: 'sendgrid',
    providerId,
  });
  return { messageQueued: true, providerId };
}

export async function sendPasswordResetEmail(email, token) {
  const sendgrid = getSendgridClient();
  const resetUrl = `${getPublicAppBaseUrl()}/reset-password/${encodeURIComponent(token)}`;
  if (!sendgrid) {
    logger.info('Reset URL generated (email skipped in local mode)', { email, resetUrl });
    return { messageQueued: false, providerId: null };
  }
  if (!config.sendgrid.resetTemplateId) {
    throw createHttpError(500, 'SENDGRID_RESET_TEMPLATE_ID is not configured', 'SENDGRID_TEMPLATE_NOT_CONFIGURED');
  }
  let response;
  try {
    response = await sendgrid.send({
      from: config.emailFrom,
      to: email,
      templateId: config.sendgrid.resetTemplateId,
      dynamicTemplateData: {
        reset_url: resetUrl,
        app_name: config.branding.appName,
        support_email: config.branding.supportEmail,
      },
    });
  } catch (error) {
    logger.error('Password reset email transport error', {
      email,
      provider: 'sendgrid',
      providerError: error?.response?.body || error?.message || String(error),
    });
    throw createHttpError(502, 'Password reset email delivery failed', 'RESET_EMAIL_DELIVERY_FAILED');
  }

  const firstResponse = Array.isArray(response) ? response[0] : response;
  const providerId = firstResponse?.headers?.['x-message-id'] || firstResponse?.headers?.['X-Message-Id'] || null;
  logger.info('Password reset email queued', {
    email,
    provider: 'sendgrid',
    providerId,
  });
  return { messageQueued: true, providerId };
}
