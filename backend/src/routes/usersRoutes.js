import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, updateUser, updateUserRole, inviteUser, deleteUser, getUserDeleteEligibility } from '../services/usersService.js';

const router = Router();

// GET /users
router.get(
  '/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    const users = await listUsers(req.user);
    res.json(users);
  }),
);

// PATCH /users/:id
router.patch(
  '/users/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await updateUser(req.params.id, req.body || {}, req.user);
    res.json(user);
  }),
);

// POST /users/:id/role
router.post(
  '/users/:id/role',
  requireAuth,
  requireRole('admin', 'department_admin'),
  asyncHandler(async (req, res) => {
    const { newRole } = req.body || {};
    const user = await updateUserRole(req.params.id, newRole, req.user);
    res.json(user);
  }),
);

// POST /users/invite
router.post(
  '/users/invite',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const invited = await inviteUser(req.body || {});
    res.status(201).json(invited);
  }),
);

// GET /users/:id/delete-eligibility
router.get(
  '/users/:id/delete-eligibility',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await getUserDeleteEligibility(req.params.id, req.user);
    res.json(result);
  }),
);

// DELETE /users/:id
router.delete(
  '/users/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { mode } = req.body || {};
    const result = await deleteUser(req.params.id, { mode }, req.user);
    res.json(result);
  }),
);

export default router;

