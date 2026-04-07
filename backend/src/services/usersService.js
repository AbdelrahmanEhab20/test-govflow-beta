import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { generateOpaqueToken, tokenExpiry, sendInviteEmail } from './authService.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

export async function listUsers() {
  return User.find(withTenant())
    .sort({ created_date: -1 })
    .lean()
    .exec();
}

export async function updateUser(userId, data) {
  const now = nowIso();
  const updated = await User.findOneAndUpdate(
    withTenant({ id: userId }),
    { $set: { ...data, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return updated;
}

export async function updateUserRole(userId, newRole) {
  if (!newRole) {
    throw createHttpError(400, 'newRole is required', 'MISSING_ROLE');
  }
  return updateUser(userId, { role: newRole });
}

export async function inviteUser(email, role = 'user') {
  if (!email) {
    throw createHttpError(400, 'email is required', 'MISSING_EMAIL');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const inviteToken = generateOpaqueToken();
  const inviteTokenExpires = tokenExpiry(config.auth.inviteTokenMinutes);
  const now = nowIso();

  const existing = await User.findOne(withTenant({ email: normalizedEmail }));
  if (existing) {
    existing.role = role || existing.role;
    existing.status = 'pending';
    existing.invite_token = inviteToken;
    existing.invite_token_expires = inviteTokenExpires;
    existing.updated_date = now;
    await existing.save();
    await sendInviteEmail(normalizedEmail, inviteToken);
    return existing.toObject();
  }

  const idPrefix = normalizedEmail.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '') || 'user';
  const created = await User.create({
    id: `invited_${idPrefix}_${uuidv4().slice(0, 8)}`,
    tenantId: config.defaultTenantId,
    full_name: normalizedEmail.split('@')[0] || 'Invited User',
    email: normalizedEmail,
    role,
    status: 'pending',
    invite_token: inviteToken,
    invite_token_expires: inviteTokenExpires,
    onboarding_completed: false,
    created_date: now,
    updated_date: now,
  });

  await sendInviteEmail(normalizedEmail, inviteToken);
  return created.toObject();
}

