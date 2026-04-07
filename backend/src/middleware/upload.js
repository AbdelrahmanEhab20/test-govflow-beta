import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config/index.js';

const uploadsRoot = path.resolve(process.cwd(), config.uploadsDir);

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsRoot);
  },
  filename(_req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

export const uploadAvatarMiddleware = multer({ storage }).single('avatar');

