import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { listEmails, getEmailById, updateEmail } from '../services/emailService.js';

const router = Router();

// GET /emails
router.get(
  '/emails',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy, limit, ...query } = req.query;
    const emails = await listEmails(query, orderBy, limit);
    res.json(emails);
  }),
);

// GET /emails/:id
router.get(
  '/emails/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = await getEmailById(req.params.id);
    res.json(email);
  }),
);

// PATCH /emails/:id
router.patch(
  '/emails/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateEmail(req.params.id, req.body || {});
    res.json(updated);
  }),
);

export default router;

