import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listWorkflowStages,
  createWorkflowStage,
  updateWorkflowStage,
  deleteWorkflowStage,
  bulkCreateWorkflowStages,
} from '../services/workflowService.js';

const router = Router();

// GET /workflow-stages
router.get(
  '/workflow-stages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy, ...filters } = req.query;
    const stages = await listWorkflowStages(filters, orderBy);
    res.json(stages);
  }),
);

// POST /workflow-stages
router.post(
  '/workflow-stages',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const created = await createWorkflowStage(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /workflow-stages/:id
router.patch(
  '/workflow-stages/:id',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const updated = await updateWorkflowStage(req.params.id, req.body || {});
    res.json(updated);
  }),
);

// DELETE /workflow-stages/:id
router.delete(
  '/workflow-stages/:id',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkflowStage(req.params.id);
    res.json(result);
  }),
);

// POST /workflow-stages/bulk
router.post(
  '/workflow-stages/bulk',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const created = await bulkCreateWorkflowStages(req.body || []);
    res.status(201).json(created);
  }),
);

export default router;

