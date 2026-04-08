import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  listSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  listComments,
  createComment,
  listTaskDependenciesByPrerequisite,
  listTaskDependenciesByDependent,
  createTaskDependency,
  deleteTaskDependency,
} from '../services/tasksService.js';

const router = Router();

// ─── Tasks ──────────────────────────────────────────────────────────────────────

// GET /tasks
router.get(
  '/tasks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderBy, limit } = req.query;
    const tasks = await listTasks({ orderBy, limit });
    res.json(tasks);
  }),
);

// GET /tasks/:id
router.get(
  '/tasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const task = await getTaskById(req.params.id);
    res.json(task);
  }),
);

// POST /tasks
router.post(
  '/tasks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createTask(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /tasks/:id
router.patch(
  '/tasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateTask(req.params.id, req.body || {}, req.user);
    res.json(updated);
  }),
);

// DELETE /tasks/:id
router.delete(
  '/tasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await deleteTask(req.params.id);
    res.json(result);
  }),
);

// ─── Subtasks ───────────────────────────────────────────────────────────────────

// GET /tasks/:id/subtasks
router.get(
  '/tasks/:id/subtasks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const subtasks = await listSubtasks(req.params.id);
    res.json(subtasks);
  }),
);

// POST /subtasks
router.post(
  '/subtasks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createSubtask(req.body || {});
    res.status(201).json(created);
  }),
);

// PATCH /subtasks/:id
router.patch(
  '/subtasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateSubtask(req.params.id, req.body || {});
    res.json(updated);
  }),
);

// DELETE /subtasks/:id
router.delete(
  '/subtasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await deleteSubtask(req.params.id);
    res.json(result);
  }),
);

// ─── Comments ───────────────────────────────────────────────────────────────────

// GET /comments?entityType=task&entityId=...
router.get(
  '/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.query;
    const comments = await listComments(entityType, entityId);
    res.json(comments);
  }),
);

// POST /comments
router.post(
  '/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createComment(req.body || {}, req.user);
    res.status(201).json(created);
  }),
);

// ─── Task dependencies ──────────────────────────────────────────────────────────

// GET /task-dependencies?taskId=...&dependentTaskId=...
router.get(
  '/task-dependencies',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { taskId, dependentTaskId } = req.query;
    if (dependentTaskId) {
      const list = await listTaskDependenciesByDependent(dependentTaskId);
      res.json(list);
      return;
    }
    if (taskId) {
      const list = await listTaskDependenciesByPrerequisite(taskId);
      res.json(list);
      return;
    }
    res.json([]);
  }),
);

// POST /task-dependencies
router.post(
  '/task-dependencies',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createTaskDependency(req.body || {});
    res.status(201).json(created);
  }),
);

// DELETE /task-dependencies/:id
router.delete(
  '/task-dependencies/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await deleteTaskDependency(req.params.id);
    res.json(result);
  }),
);

export default router;

