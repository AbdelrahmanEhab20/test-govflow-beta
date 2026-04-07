import mongoose from 'mongoose';
import { config } from '../config/index.js';

let connected = false;

/**
 * Connect to MongoDB.
 * If `required` is true (default in production), throws on failure.
 * In development mode, just warns so the HTTP server can still start
 * and you can see the /health endpoint reporting db:disconnected.
 */
export async function connectDB({ required = process.env.NODE_ENV === 'production' } = {}) {
  if (connected) return;

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log(`[db] Connected to MongoDB at ${config.mongoUri}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    if (required) throw err;
    console.warn('[db] Continuing without MongoDB (development mode) – start MongoDB to use data endpoints');
  }
}

mongoose.connection.on('disconnected', () => {
  connected = false;
  console.warn('[db] MongoDB disconnected');
});
