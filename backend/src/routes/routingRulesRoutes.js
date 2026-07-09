import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  reorderRoutingRules,
} from '../services/routingRulesService.js';

const router = Router();

// GET /routing-rules
router.get(
  '/routing-rules',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy } = req.query;
    const rules = await listRoutingRules(orderBy);
    res.json(rules);
  }),
);

// POST /routing-rules/reorder
router.post(
  '/routing-rules/reorder',
  requireAuth,
  requireRole('admin', 'department_admin', 'editor'),
  asyncHandler(async (req, res) => {
    const { orderedIds } = req.body || {};
    const rules = await reorderRoutingRules(orderedIds);
    res.json(rules);
  }),
);

// POST /routing-rules
router.post(
  '/routing-rules',
  requireAuth,
  requireRole('admin', 'department_admin', 'editor'),
  asyncHandler(async (req, res) => {
    const created = await createRoutingRule(req.body || {}, {
      actorUserId: req.user?.id,
    });
    res.status(201).json(created);
  }),
);

// PATCH /routing-rules/:id
router.patch(
  '/routing-rules/:id',
  requireAuth,
  requireRole('admin', 'department_admin', 'editor'),
  asyncHandler(async (req, res) => {
    const updated = await updateRoutingRule(req.params.id, req.body || {}, {
      actorUserId: req.user?.id,
    });
    res.json(updated);
  }),
);

// DELETE /routing-rules/:id
router.delete(
  '/routing-rules/:id',
  requireAuth,
  requireRole('admin', 'department_admin', 'editor'),
  asyncHandler(async (req, res) => {
    const result = await deleteRoutingRule(req.params.id);
    res.json(result);
  }),
);

export default router;

