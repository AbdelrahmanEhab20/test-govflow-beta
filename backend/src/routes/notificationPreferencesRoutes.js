import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getNotificationPreferencesForUser,
  listNotificationPreferencesForUser,
  updateNotificationPreference,
  createNotificationPreference,
} from '../services/notificationsService.js';

const router = Router();

// GET /notification-preferences?userId=...
router.get(
  '/notification-preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id;
    const pref = await getNotificationPreferencesForUser(userId);
    res.json(pref);
  }),
);

// GET /notification-preferences/list?userId=...
router.get(
  '/notification-preferences/list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id;
    const prefs = await listNotificationPreferencesForUser(userId);
    res.json(prefs);
  }),
);

// POST /notification-preferences
router.post(
  '/notification-preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createNotificationPreference({
      ...req.body,
      user_id: req.body.user_id || req.user?.id,
      user_email: req.body.user_email || req.user?.email,
    });
    res.status(201).json(created);
  }),
);

// PATCH /notification-preferences/:id
router.patch(
  '/notification-preferences/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateNotificationPreference(req.params.id, req.body || {});
    res.json(updated);
  }),
);

export default router;

