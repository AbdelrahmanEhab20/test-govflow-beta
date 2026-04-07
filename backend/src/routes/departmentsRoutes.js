import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listTeams,
  updateTeamMember,
} from '../services/departmentsService.js';

const router = Router();

// ─── Departments ────────────────────────────────────────────────────────────────

// GET /departments
router.get(
  '/departments',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const departments = await listDepartments();
    res.json(departments);
  }),
);

// POST /departments
router.post(
  '/departments',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const created = await createDepartment(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /departments/:id
router.patch(
  '/departments/:id',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const updated = await updateDepartment(req.params.id, req.body || {});
    res.json(updated);
  }),
);

// DELETE /departments/:id
router.delete(
  '/departments/:id',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const result = await deleteDepartment(req.params.id);
    res.json(result);
  }),
);

// ─── Teams (TeamMember) ────────────────────────────────────────────────────────

// GET /teams
router.get(
  '/teams',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const teams = await listTeams();
    res.json(teams);
  }),
);

// PATCH /teams/:id
router.patch(
  '/teams/:id',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const updated = await updateTeamMember(req.params.id, req.body || {});
    res.json(updated);
  }),
);

export default router;

