import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listNotificationsForUser,
  markNotificationRead,
  deleteNotification,
} from '../services/notificationsService.js';

const router = Router();

// GET /notifications?userId=...
router.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id;
    const list = await listNotificationsForUser(userId);
    res.json(list);
  }),
);

// PATCH /notifications/:id/read
router.patch(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await markNotificationRead(req.params.id);
    res.json(updated);
  }),
);

// DELETE /notifications/:id
router.delete(
  '/notifications/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await deleteNotification(req.params.id);
    res.json(result);
  }),
);

export default router;

