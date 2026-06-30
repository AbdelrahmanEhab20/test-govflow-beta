import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config/index.js';

function isRemoteStorageEnabled() {
  const { bucket, endpoint, accessKeyId, secretAccessKey, publicBaseUrl } = config.storage;
  return Boolean(bucket && endpoint && accessKeyId && secretAccessKey && publicBaseUrl);
}

function buildDiskStorage() {
  const uploadsRoot = path.resolve(process.cwd(), config.uploadsDir);

  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }

  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, uploadsRoot);
    },
    filename(_req, file, cb) {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    },
  });
}

const storage = isRemoteStorageEnabled() ? multer.memoryStorage() : buildDiskStorage();

export const uploadAvatarMiddleware = multer({
  storage,
  limits: { fileSize: config.uploadsMaxSize },
}).single('avatar');
