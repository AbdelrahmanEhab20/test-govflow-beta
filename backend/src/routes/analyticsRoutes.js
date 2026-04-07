import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getLeaderboardData,
  getLeaderboardFilterOptions,
  analyzeTeamPerformance,
} from '../services/analyticsService.js';

const router = Router();

// POST /analytics/leaderboard
router.post(
  '/analytics/leaderboard',
  requireAuth,
  requireRole('admin', 'department_admin', 'department_manager'),
  asyncHandler(async (req, res) => {
    const data = await getLeaderboardData(req.body || {});
    res.json(data);
  }),
);

// GET /analytics/leaderboard-filters
router.get(
  '/analytics/leaderboard-filters',
  requireAuth,
  requireRole('admin', 'department_admin', 'department_manager'),
  asyncHandler(async (_req, res) => {
    const data = await getLeaderboardFilterOptions();
    res.json(data);
  }),
);

// POST /analytics/analyze-team-performance
router.post(
  '/analytics/analyze-team-performance',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await analyzeTeamPerformance(req.body || {});
    res.json(data);
  }),
);

export default router;

