import { v4 as uuidv4 } from 'uuid';
import { Department, User } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { normalizeEmail, generateOpaqueToken, tokenExpiry, sendInviteEmail } from './authService.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

function isAdmin(role) {
  return role === 'admin';
}

function isDepartmentAdmin(role) {
  return role === 'department_admin';
}

function isDepartmentManager(role) {
  return role === 'department_manager';
}

function canAccessUser(actor, target) {
  if (!actor || !target) return false;
  if (isAdmin(actor.role)) return true;
  if (actor.id === target.id) return true;
  if (isDepartmentAdmin(actor.role)) {
    return actor.department && target.department && actor.department === target.department && target.role !== 'admin';
  }
  if (isDepartmentManager(actor.role)) {
    return (
      actor.department &&
      target.department &&
      actor.department === target.department &&
      ['team_member', 'user', 'department_manager'].includes(target.role)
    );
  }
  return false;
}

function sanitizeUser(user) {
  if (!user) return null;
  const base = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete base.password_hash;
  delete base.invite_token;
  delete base.invite_token_expires;
  delete base.reset_token;
  delete base.reset_token_expires;
  return base;
}

async function loadCanonicalDepartmentMap() {
  const departments = await Department.find(withTenant()).lean().exec();
  const map = new Map();
  for (const department of departments) {
    const canonicalName = String(department?.name || '').trim();
    if (!canonicalName) continue;
    map.set(canonicalName.toLowerCase(), canonicalName);
  }
  return map;
}

function normalizeDepartmentFromInput(rawDepartment, canonicalDepartmentMap) {
  if (rawDepartment === undefined) return undefined;
  const normalized = String(rawDepartment || '').trim();
  if (!normalized) return '';
  const canonicalName = canonicalDepartmentMap.get(normalized.toLowerCase());
  if (!canonicalName) {
    throw createHttpError(
      400,
      `Invalid department "${normalized}". Please select an existing department.`,
      'INVALID_DEPARTMENT',
    );
  }
  return canonicalName;
}

export async function listUsers(actor = null) {
  const users = await User.find(withTenant())
    .sort({ created_date: -1 })
    .lean()
    .exec();
  const visibleUsers = users.filter((user) => {
    if (!actor) return false;
    if (isAdmin(actor.role)) return true;
    if (actor.id === user.id) return true;
    if (isDepartmentAdmin(actor.role) || isDepartmentManager(actor.role)) {
      return actor.department && user.department && actor.department === user.department;
    }
    if (actor.role === 'team_member' || actor.role === 'user') {
      return actor.department && user.department && actor.department === user.department;
    }
    return false;
  });
  return visibleUsers.map((user) => sanitizeUser(user));
}

export async function updateUser(userId, data, actor = null) {
  const target = await User.findOne(withTenant({ id: userId })).lean();
  if (!target) {
    throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
  }
  if (!canAccessUser(actor, target)) {
    throw createHttpError(403, 'Forbidden', 'FORBIDDEN');
  }

  const allowedFields = [
    'full_name',
    'full_name_ar',
    'phone',
    'department',
    'department_id',
    'position',
    'avatar_url',
    'notification_preferences',
    'mailboxes',
    'onboarding_completed',
  ];
  const patch = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data || {}, field)) {
      patch[field] = data[field];
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'department')) {
    const canonicalDepartmentMap = await loadCanonicalDepartmentMap();
    patch.department = normalizeDepartmentFromInput(patch.department, canonicalDepartmentMap);
  }

  const allDepartments = await Department.find(withTenant()).lean().exec();
  const deptById = new Map(allDepartments.map((department) => [department.id, department]));

  if (Object.prototype.hasOwnProperty.call(patch, 'department_id')) {
    const deptId = String(patch.department_id || '').trim();
    if (!deptId) {
      patch.department = '';
    } else {
      const department = deptById.get(deptId);
      if (!department) {
        throw createHttpError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
      }
      patch.department = department.name;
    }
  } else if (Object.prototype.hasOwnProperty.call(patch, 'department')) {
    const deptName = patch.department;
    if (!deptName) {
      patch.department_id = '';
    } else {
      const department = allDepartments.find((item) => item.name === deptName);
      patch.department_id = department?.id || '';
    }
  }

  const now = nowIso();
  const updated = await User.findOneAndUpdate(
    withTenant({ id: userId }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return sanitizeUser(updated);
}

export async function updateUserRole(userId, newRole, actor = null) {
  if (!newRole) {
    throw createHttpError(400, 'newRole is required', 'MISSING_ROLE');
  }
  const target = await User.findOne(withTenant({ id: userId })).lean();
  if (!target) {
    throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
  }

  if (isAdmin(actor?.role)) {
    const updated = await User.findOneAndUpdate(
      withTenant({ id: userId }),
      { $set: { role: newRole, updated_date: nowIso() } },
      { new: true },
    ).lean();
    if (!updated) {
      throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return sanitizeUser(updated);
  }

  if (isDepartmentAdmin(actor?.role)) {
    const sameDepartment = actor.department && target.department && actor.department === target.department;
    const allowedTarget = ['team_member', 'user', 'department_manager'].includes(target.role);
    const allowedNewRole = ['team_member', 'user', 'department_manager'].includes(newRole);
    if (sameDepartment && allowedTarget && allowedNewRole) {
      const updated = await User.findOneAndUpdate(
        withTenant({ id: userId }),
        { $set: { role: newRole, updated_date: nowIso() } },
        { new: true },
      ).lean();
      if (!updated) {
        throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
      }
      return sanitizeUser(updated);
    }
  }

  throw createHttpError(403, 'Forbidden', 'FORBIDDEN');
}

export async function inviteUser(invitePayload = {}) {
  const email = normalizeEmail(invitePayload?.email);
  const role = String(invitePayload?.role || 'user').trim() || 'user';
  const fullName = String(invitePayload?.full_name || '').trim();
  const canonicalDepartmentMap = await loadCanonicalDepartmentMap();
  const department = normalizeDepartmentFromInput(invitePayload?.department, canonicalDepartmentMap) || '';
  const position = String(invitePayload?.position || '').trim();

  if (!email) {
    throw createHttpError(400, 'email is required', 'MISSING_EMAIL');
  }

  const inviteToken = generateOpaqueToken();
  const inviteTokenExpires = tokenExpiry(config.auth.inviteTokenMinutes);
  const now = nowIso();

  const existing = await User.findOne(withTenant({ email }));
  const isResend = Boolean(existing);

  if (existing) {
    existing.role = role || existing.role;
    if (fullName) existing.full_name = fullName;
    if (department) existing.department = department;
    if (position) existing.position = position;
    existing.status = 'pending';
    existing.invite_token = inviteToken;
    existing.invite_token_expires = inviteTokenExpires;
    existing.reset_token = undefined;
    existing.reset_token_expires = undefined;
    existing.invite_delivery_status = 'pending';
    existing.invite_delivery_error = undefined;
    existing.invite_delivery_provider_id = undefined;
    existing.updated_date = now;
    await existing.save();
  } else {
    const idPrefix = email.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '') || 'user';
    await User.create({
      id: `invited_${idPrefix}_${uuidv4().slice(0, 8)}`,
      tenantId: config.defaultTenantId,
      full_name: fullName || email.split('@')[0] || 'Invited User',
      email,
      role,
      status: 'pending',
      invite_token: inviteToken,
      invite_token_expires: inviteTokenExpires,
      onboarding_completed: false,
      ...(department ? { department } : {}),
      ...(position ? { position } : {}),
      invite_delivery_status: 'pending',
      created_date: now,
      updated_date: now,
    });
  }

  let deliveryStatus = { messageQueued: false, providerId: null, status: 'failed' };
  try {
    const delivery = await sendInviteEmail(email, inviteToken);
    deliveryStatus = {
      messageQueued: Boolean(delivery?.messageQueued),
      providerId: delivery?.providerId || null,
      status: delivery?.messageQueued ? 'queued' : 'not_sent',
    };
  } catch (error) {
    deliveryStatus = {
      messageQueued: false,
      providerId: null,
      status: 'failed',
      error: error?.message || 'Invite email delivery failed',
    };
  }

  const deliveryUpdate = {
    $set: {
      invite_delivery_status: deliveryStatus.status,
      updated_date: nowIso(),
    },
  };
  if (deliveryStatus.providerId) {
    deliveryUpdate.$set.invite_delivery_provider_id = deliveryStatus.providerId;
  } else {
    deliveryUpdate.$unset = { ...(deliveryUpdate.$unset || {}), invite_delivery_provider_id: '' };
  }
  if (deliveryStatus.error) {
    deliveryUpdate.$set.invite_delivery_error = deliveryStatus.error;
  } else {
    deliveryUpdate.$unset = { ...(deliveryUpdate.$unset || {}), invite_delivery_error: '' };
  }
  if (deliveryStatus.messageQueued) {
    deliveryUpdate.$set.invite_sent_at = nowIso();
  } else {
    deliveryUpdate.$unset = { ...(deliveryUpdate.$unset || {}), invite_sent_at: '' };
  }

  const saved = await User.findOneAndUpdate(withTenant({ email }), deliveryUpdate, { new: true });

  if (!saved) {
    throw createHttpError(500, 'Failed to load invited user record', 'INVITE_USER_NOT_FOUND');
  }

  if (deliveryStatus.status === 'failed') {
    throw createHttpError(
      502,
      `Invite created but email delivery failed for ${email}. Please retry.`,
      'INVITE_EMAIL_DELIVERY_FAILED',
    );
  }

  return {
    success: true,
    user: sanitizeUser(saved),
    isResend,
    deliveryStatus: {
      status: deliveryStatus.status,
      messageQueued: deliveryStatus.messageQueued,
      providerId: deliveryStatus.providerId || null,
    },
    ...(process.env.NODE_ENV !== 'production' ? { invite_token: inviteToken } : {}),
  };
}

