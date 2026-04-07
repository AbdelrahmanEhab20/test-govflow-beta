import { Router } from 'express';
import path from 'node:path';
import { config } from '../config/index.js';
import { asyncHandler, createHttpError } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadAvatarMiddleware } from '../middleware/upload.js';
import { User } from '../models/index.js';
import { inviteUser } from '../services/usersService.js';
import {
  normalizeEmail,
  ensureStrongPassword,
  hashPassword,
  comparePassword,
  signAccessToken,
  generateOpaqueToken,
  tokenExpiry,
  sendPasswordResetEmail,
} from '../services/authService.js';

const router = Router();

function sanitizeUser(user) {
  if (!user) return null;
  const base = typeof user.toObject === 'function' ? user.toObject() : user;
  delete base.password_hash;
  delete base.invite_token;
  delete base.invite_token_expires;
  delete base.reset_token;
  delete base.reset_token_expires;
  return base;
}

function nowIso() {
  return new Date().toISOString();
}

// GET /auth/public-settings
router.get(
  '/public-settings',
  (req, res) => {
    res.json({
      id: config.defaultTenantId,
      public_settings: {
        auth_required: true,
        appName: config.branding.appName,
        logoUrl: config.branding.logoUrl,
        faviconUrl: config.branding.faviconUrl,
        primaryColor: config.branding.primaryColor,
        secondaryColor: config.branding.secondaryColor,
        accentColor: config.branding.accentColor,
        companyName: config.branding.companyName,
        sidebarTitle: config.branding.sidebarTitle,
        tagline: config.branding.tagline,
        supportEmail: config.branding.supportEmail,
        websiteUrl: config.branding.websiteUrl,
        showGovflowCredit: config.branding.showGovflowCredit,
        govflowCreditText: config.branding.govflowCreditText,
        govflowCreditUrl: config.branding.govflowCreditUrl,
      },
    });
  }
);

// GET /auth/me
router.get(
  '/me',
  requireAuth,
  (req, res) => {
    res.json(sanitizeUser(req.user));
  }
);

// POST /auth/dev-login
router.post(
  '/dev-login',
  asyncHandler(async (req, res) => {
    if (!config.allowDevLogin) {
      throw createHttpError(403, 'Dev login is disabled', 'DEV_LOGIN_DISABLED');
    }
    const { userId, email } = req.body || {};
    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_IDENTIFIER', message: 'userId or email is required' },
      });
    }

    const filter = userId
      ? { id: userId }
      : { email: String(email).trim().toLowerCase() };
    const user = await User.findOne(filter).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    const token = signAccessToken(user);
    res.json({ success: true, token, user: sanitizeUser(user) });
  }),
);

// POST /auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required', 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email }).select('+password_hash').lean();
    if (!user || !user.password_hash) {
      throw createHttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw createHttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    if (user.status === 'inactive') {
      throw createHttpError(403, 'Account is inactive', 'ACCOUNT_INACTIVE');
    }
    if (user.status === 'pending') {
      throw createHttpError(403, 'Account setup is not complete', 'ACCOUNT_PENDING');
    }

    const token = signAccessToken(user);
    res.json({ success: true, token, user: sanitizeUser(user) });
  }),
);

// POST /auth/invite
router.post(
  '/invite',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const invited = await inviteUser(req.body || {});
    res.status(201).json(invited);
  })
);

// POST /auth/accept-invite/:token
router.post(
  '/accept-invite/:token',
  asyncHandler(async (req, res) => {
    const inviteToken = String(req.params.token || '').trim();
    const password = String(req.body?.password || '');
    ensureStrongPassword(password);
    if (!inviteToken) {
      throw createHttpError(400, 'Invite token is required', 'MISSING_INVITE_TOKEN');
    }

    const user = await User.findOne({
      invite_token: inviteToken,
      invite_token_expires: { $gt: new Date() },
    });
    if (!user) {
      throw createHttpError(400, 'Invite is invalid or expired', 'INVITE_INVALID_OR_EXPIRED');
    }

    user.password_hash = await hashPassword(password);
    user.status = 'active';
    user.invite_token = undefined;
    user.invite_token_expires = undefined;
    user.updated_date = nowIso();
    await user.save();

    const token = signAccessToken(user);
    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  })
);

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      throw createHttpError(400, 'email is required', 'MISSING_EMAIL');
    }

    const user = await User.findOne({ email });
    let resetDelivery = null;
    if (user) {
      const resetToken = generateOpaqueToken();
      user.reset_token = resetToken;
      user.reset_token_expires = tokenExpiry(config.auth.resetTokenMinutes);
      user.updated_date = nowIso();
      await user.save();
      resetDelivery = await sendPasswordResetEmail(email, resetToken);
    }

    res.json({
      success: true,
      message: 'If the account exists, a reset email has been sent.',
      ...(resetDelivery
        ? {
            deliveryStatus: {
              messageQueued: Boolean(resetDelivery.messageQueued),
              providerId: resetDelivery.providerId || null,
            },
          }
        : {}),
      ...(process.env.NODE_ENV !== 'production' && user?.reset_token ? { reset_token: user.reset_token } : {}),
    });
  })
);

// POST /auth/reset-password/:token
router.post(
  '/reset-password/:token',
  asyncHandler(async (req, res) => {
    const resetToken = String(req.params.token || '').trim();
    const password = String(req.body?.password || '');
    ensureStrongPassword(password);
    if (!resetToken) {
      throw createHttpError(400, 'Reset token is required', 'MISSING_RESET_TOKEN');
    }

    const user = await User.findOne({
      reset_token: resetToken,
      reset_token_expires: { $gt: new Date() },
    });
    if (!user) {
      throw createHttpError(400, 'Reset token is invalid or expired', 'RESET_INVALID_OR_EXPIRED');
    }

    user.password_hash = await hashPassword(password);
    user.status = 'active';
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    user.updated_date = nowIso();
    await user.save();

    const token = signAccessToken(user);
    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  })
);

// PATCH /auth/me
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'full_name',
      'full_name_ar',
      'phone',
      'department',
      'department_id',
      'position',
      'avatar_url',
      'notification_preferences',
      'mailboxes',
      'onboarding_completed',
    ];

    const patch = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        patch[field] = req.body[field];
      }
    }

    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: patch },
      { new: true }
    ).lean();

    res.json(sanitizeUser(user));
  })
);

// POST /auth/avatar  (multipart form-data, field: avatar)
router.post(
  '/avatar',
  requireAuth,
  uploadAvatarMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No avatar file uploaded' },
      });
    }

    const fileName = path.basename(req.file.path);
    const publicPath = `/uploads/${fileName}`;

    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: { avatar_url: publicPath } },
      { new: true }
    ).lean();

    res.json({ avatar_url: user.avatar_url, user });
  })
);

// POST /auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;

