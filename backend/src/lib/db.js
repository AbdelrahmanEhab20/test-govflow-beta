import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let connected = false;

function getMongoTarget(uri) {
  try {
    const normalized = uri.startsWith('mongodb') ? uri : `mongodb://${uri}`;
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return 'unparseable-mongo-uri';
  }
}

/**
 * Connect to MongoDB.
 * If `required` is true (default in production), throws on failure.
 * In development mode, just warns so the HTTP server can still start
 * and you can see the /health endpoint reporting db:disconnected.
 */
export async function connectDB({ required = process.env.NODE_ENV === 'production' } = {}) {
  if (connected) return;

  const mongoTarget = getMongoTarget(config.mongoUri);
  logger.info('Attempting MongoDB connection', {
    target: mongoTarget,
    required,
    env: process.env.NODE_ENV || 'development',
  });

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    logger.info('MongoDB connected', { target: mongoTarget });
  } catch (err) {
    logger.error('MongoDB connection failed', {
      target: mongoTarget,
      error: err.message,
      required,
    });
    if (required) throw err;
    logger.warn('Continuing without MongoDB (development mode)', {
      target: mongoTarget,
      hint: 'Start MongoDB to use data endpoints',
    });
  }
}

mongoose.connection.on('disconnected', () => {
  connected = false;
  logger.warn('MongoDB disconnected');
});
