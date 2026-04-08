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

function getAllowedMailboxes(actor) {
  const mailboxes = Array.isArray(actor?.mailboxes) ? actor.mailboxes : [];
  return mailboxes
    .map((mailbox) => String(mailbox?.email || '').trim().toLowerCase())
    .filter(Boolean);
}

export async function listEmails(actor, query = {}, orderBy = '-received_at', limit = 100) {
  const allowedMailboxes = getAllowedMailboxes(actor);
  if (allowedMailboxes.length === 0) {
    return [];
  }

  const mailboxQuery = String(query?.mailbox || '').trim().toLowerCase();
  if (mailboxQuery && !allowedMailboxes.includes(mailboxQuery)) {
    throw createHttpError(403, 'Forbidden mailbox access', 'FORBIDDEN_MAILBOX');
  }

  const finalMailboxFilter = mailboxQuery ? [mailboxQuery] : allowedMailboxes;
  const { mailbox: _mailbox, ...restQuery } = query || {};
  const mongoQuery = {
    ...restQuery,
    mailbox: { $in: finalMailboxFilter },
  };

  let q = EmailMessage.find(withTenant(mongoQuery)).lean();
  q = applySort(q, orderBy);
  if (limit) {
    const n = Number(limit);
    if (!Number.isNaN(n) && n > 0) {
      q = q.limit(n);
    }
  }
  return q.exec();
}

export async function getEmailById(actor, id) {
  const allowedMailboxes = getAllowedMailboxes(actor);
  if (allowedMailboxes.length === 0) {
    throw createHttpError(404, 'Email not found', 'EMAIL_NOT_FOUND');
  }

  const email = await EmailMessage.findOne(withTenant({ id })).lean();
  if (!email) {
    throw createHttpError(404, 'Email not found', 'EMAIL_NOT_FOUND');
  }
  if (!allowedMailboxes.includes(String(email.mailbox || '').trim().toLowerCase())) {
    throw createHttpError(403, 'Forbidden mailbox access', 'FORBIDDEN_MAILBOX');
  }
  return email;
}

export async function updateEmail(actor, id, patch) {
  const existing = await getEmailById(actor, id);
  const now = new Date().toISOString();
  const updated = await EmailMessage.findOneAndUpdate(
    withTenant({ id: existing.id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Email not found', 'EMAIL_NOT_FOUND');
  }
  return updated;
}

