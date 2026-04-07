import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { listTaskApprovals, submitForApproval } from '../services/approvalsService.js';

const router = Router();

// GET /tasks/:id/approvals
router.get(
  '/tasks/:id/approvals',
  requireAuth,
  asyncHandler(async (req, res) => {
    const approvals = await listTaskApprovals(req.params.id);
    res.json(approvals);
  }),
);

// POST /tasks/:id/submit-for-approval
router.post(
  '/tasks/:id/submit-for-approval',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await submitForApproval(req.params.id);
    res.json(result);
  }),
);

export default router;

