import { EmailMessage } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function applySort(query, orderBy) {
  if (!orderBy || typeof orderBy !== 'string') return query;
  const desc = orderBy.startsWith('-');
  const field = desc ? orderBy.slice(1) : orderBy;
  if (!field) return query;
  return query.sort({ [field]: desc ? -1 : 1 });
}

export async function listEmails(query = {}, orderBy = '-received_at', limit = 100) {
  let q = EmailMessage.find(withTenant(query)).lean();
  q = applySort(q, orderBy);
  if (limit) {
    const n = Number(limit);
    if (!Number.isNaN(n) && n > 0) {
      q = q.limit(n);
    }
  }
  return q.exec();
}

export async function getEmailById(id) {
  const email = await EmailMessage.findOne(withTenant({ id })).lean();
  if (!email) {
    throw createHttpError(404, 'Email not found', 'EMAIL_NOT_FOUND');
  }
  return email;
}

export async function updateEmail(id, patch) {
  const now = new Date().toISOString();
  const updated = await EmailMessage.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Email not found', 'EMAIL_NOT_FOUND');
  }
  return updated;
}

