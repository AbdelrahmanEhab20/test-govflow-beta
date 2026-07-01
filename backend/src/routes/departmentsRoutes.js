import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  moveDepartmentInHierarchy,
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

// POST /departments/hierarchy-move
router.post(
  '/departments/hierarchy-move',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const { department_id: departmentId, parent_department_id: parentDepartmentId, sort_index: sortIndex } =
      req.body || {};

    if (!departmentId || sortIndex === undefined || sortIndex === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'department_id and sort_index are required' },
      });
    }

    const updated = await moveDepartmentInHierarchy(
      departmentId,
      parentDepartmentId || null,
      Number(sortIndex),
    );
    res.json(updated);
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

