import fs from 'node:fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/index.js';

let s3Client = null;

export function isRemoteStorageEnabled() {
  const { bucket, endpoint, accessKeyId, secretAccessKey, publicBaseUrl } = config.storage;
  return Boolean(bucket && endpoint && accessKeyId && secretAccessKey && publicBaseUrl);
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey,
      },
    });
  }
  return s3Client;
}

function buildAvatarKey(originalName) {
  const timestamp = Date.now();
  const safeName = String(originalName || 'avatar').replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `avatars/${timestamp}_${safeName}`;
}

export async function uploadAvatar(file) {
  if (!isRemoteStorageEnabled()) {
    throw new Error('Remote object storage is not configured');
  }

  const key = buildAvatarKey(file.originalname);
  const body = file.buffer ?? (file.path ? await fs.readFile(file.path) : null);

  if (!body) {
    throw new Error('Avatar upload file buffer is missing');
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: body,
      ContentType: file.mimetype || 'application/octet-stream',
    })
  );

  return `${config.storage.publicBaseUrl}/${key}`;
}
