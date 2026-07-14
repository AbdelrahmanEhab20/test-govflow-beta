import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listEmails,
  listEmailsPaginated,
  getEmailCounts,
  getEmailById,
  updateEmail,
} from '../services/emailService.js';

const router = Router();

// GET /emails/counts
router.get(
  '/emails/counts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy: _orderBy, limit: _limit, skip: _skip, paginated: _paginated, ...query } =
      req.query;
    const counts = await getEmailCounts(req.user, query);
    res.json(counts);
  }),
);

// GET /emails
router.get(
  '/emails',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy, limit, skip, paginated, ...query } = req.query;

    if (paginated === 'true' || paginated === '1') {
      const result = await listEmailsPaginated(req.user, query, orderBy, limit, skip);
      res.json(result);
      return;
    }

    const emails = await listEmails(req.user, query, orderBy, limit, skip);
    res.json(emails);
  }),
);

// GET /emails/:id
router.get(
  '/emails/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = await getEmailById(req.user, req.params.id);
    res.json(email);
  }),
);

// PATCH /emails/:id
router.patch(
  '/emails/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateEmail(req.user, req.params.id, req.body || {});
    res.json(updated);
  }),
);

export default router;
