import { config } from './config/index.js';
import { connectDB } from './lib/db.js';
import { logger } from './lib/logger.js';
import app from './app.js';

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      logger.info(`GovFlow backend running`, {
        port: config.port,
        mongoUri: config.mongoUri,
        tenant: config.defaultTenantId,
        env: process.env.NODE_ENV || 'development',
      });
      console.log(`\n  GovFlow API  →  http://localhost:${config.port}`);
      console.log(`  Health check →  http://localhost:${config.port}/health\n`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully…`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

startServer();
