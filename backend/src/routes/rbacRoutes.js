import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listRolePageAccess,
  createRolePageAccess,
  updateRolePageAccess,
  listRolePermissions,
  createRolePermission,
  updateRolePermission,
} from '../services/rbacService.js';

const router = Router();

// ─── Role-page access ───────────────────────────────────────────────────────────

// GET /role-page-access
router.get(
  '/role-page-access',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy } = req.query;
    const rules = await listRolePageAccess(orderBy);
    res.json(rules);
  }),
);

// POST /role-page-access
router.post(
  '/role-page-access',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const created = await createRolePageAccess(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /role-page-access/:id
router.patch(
  '/role-page-access/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const updated = await updateRolePageAccess(req.params.id, req.body || {});
    res.json(updated);
  }),
);

// ─── Role-permission rules ──────────────────────────────────────────────────────

// GET /role-permissions
router.get(
  '/role-permissions',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const list = await listRolePermissions();
    res.json(list);
  }),
);

// POST /role-permissions
router.post(
  '/role-permissions',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const created = await createRolePermission(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /role-permissions/:id
router.patch(
  '/role-permissions/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const updated = await updateRolePermission(req.params.id, req.body || {});
    res.json(updated);
  }),
);

export default router;

