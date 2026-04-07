import { Router } from 'express';
import path from 'node:path';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadAvatarMiddleware } from '../middleware/upload.js';
import { User } from '../models/index.js';

const router = Router();

// GET /auth/public-settings
router.get(
  '/public-settings',
  (req, res) => {
    res.json({
      id: config.defaultTenantId,
      public_settings: {
        auth_required: false,
      },
    });
  }
);

// GET /auth/me
router.get(
  '/me',
  requireAuth,
  (req, res) => {
    res.json(req.user);
  }
);

// POST /auth/dev-login
router.post(
  '/dev-login',
  asyncHandler(async (req, res) => {
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

    // Dev token format is simply the user id.
    res.json({ success: true, token: user.id, user });
  }),
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

    res.json(user);
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
  // Stateless in current dev mode.
  res.json({ success: true });
});

export default router;

