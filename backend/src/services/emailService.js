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

function buildMailboxQuery(actor, query = {}) {
  const allowedMailboxes = getAllowedMailboxes(actor);
  if (allowedMailboxes.length === 0) {
    return { allowedMailboxes, mongoQuery: null };
  }

  const mailboxQuery = String(query?.mailbox || '').trim().toLowerCase();
  if (mailboxQuery && !allowedMailboxes.includes(mailboxQuery)) {
    throw createHttpError(403, 'Forbidden mailbox access', 'FORBIDDEN_MAILBOX');
  }

  const finalMailboxFilter = mailboxQuery ? [mailboxQuery] : allowedMailboxes;
  const {
    mailbox: _mailbox,
    paginated: _paginated,
    skip: _skip,
    is_starred: isStarredFilter,
    has_linked_task: hasLinkedTaskFilter,
    ...restQuery
  } = query || {};
  const mongoQuery = {
    ...restQuery,
    mailbox: { $in: finalMailboxFilter },
  };

  if (isStarredFilter === 'true' || isStarredFilter === true) {
    mongoQuery.is_starred = true;
  }
  if (hasLinkedTaskFilter === 'true' || hasLinkedTaskFilter === true) {
    mongoQuery.linked_task_id = { $exists: true, $nin: [null, ''] };
  }

  return { allowedMailboxes, mongoQuery };
}

export async function listEmails(
  actor,
  query = {},
  orderBy = '-received_at',
  limit = 100,
  skip = 0,
) {
  const { mongoQuery } = buildMailboxQuery(actor, query);
  if (!mongoQuery) {
    return [];
  }

  const limitNum = Number(limit);
  const skipNum = Number(skip) || 0;
  const effectiveLimit = !Number.isNaN(limitNum) && limitNum > 0 ? limitNum : 100;

  let q = EmailMessage.find(withTenant(mongoQuery)).lean();
  q = applySort(q, orderBy);
  q = q.skip(skipNum).limit(effectiveLimit);
  return q.exec();
}

export async function listEmailsPaginated(
  actor,
  query = {},
  orderBy = '-received_at',
  limit = 100,
  skip = 0,
) {
  const { mongoQuery } = buildMailboxQuery(actor, query);
  if (!mongoQuery) {
    return { items: [], total: 0, hasMore: false, skip: 0, limit: Number(limit) || 100 };
  }

  const limitNum = Number(limit);
  const skipNum = Number(skip) || 0;
  const effectiveLimit = !Number.isNaN(limitNum) && limitNum > 0 ? limitNum : 100;

  const filter = withTenant(mongoQuery);
  const total = await EmailMessage.countDocuments(filter);
  let q = EmailMessage.find(filter).lean();
  q = applySort(q, orderBy);
  q = q.skip(skipNum).limit(effectiveLimit);
  const items = await q.exec();

  return {
    items,
    total,
    hasMore: skipNum + items.length < total,
    skip: skipNum,
    limit: effectiveLimit,
  };
}

export async function getEmailCounts(actor, query = {}) {
  const { mongoQuery } = buildMailboxQuery(actor, query);
  if (!mongoQuery) {
    return { all: 0, new: 0, starred: 0, converted: 0, archived: 0 };
  }

  const filter = withTenant(mongoQuery);
  const [all, newCount, starred, converted, archived] = await Promise.all([
    EmailMessage.countDocuments(filter),
    EmailMessage.countDocuments({ ...filter, status_in_system: 'new' }),
    EmailMessage.countDocuments({ ...filter, is_starred: true }),
    EmailMessage.countDocuments({ ...filter, linked_task_id: { $exists: true, $nin: [null, ''] } }),
    EmailMessage.countDocuments({ ...filter, status_in_system: 'archived' }),
  ]);

  return {
    all,
    new: newCount,
    starred,
    converted,
    archived,
  };
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
