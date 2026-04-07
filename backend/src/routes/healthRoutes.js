import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /health
 * Returns the server status and MongoDB connection state.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 0 ? 'disconnected' :
    dbState === 1 ? 'connected' :
    dbState === 2 ? 'connecting' :
    'disconnecting';

  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    server: 'govflow-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

export default router;
