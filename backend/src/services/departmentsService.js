import { v4 as uuidv4 } from 'uuid';
import { Department, TeamMember } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

export async function listDepartments() {
  return Department.find(withTenant())
    .sort({ name: 1 })
    .lean()
    .exec();
}

export async function createDepartment(data) {
  const now = nowIso();
  const doc = await Department.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...data,
  });
  return doc.toObject();
}

export async function updateDepartment(id, patch) {
  const now = nowIso();
  const updated = await Department.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
  }
  return updated;
}

export async function deleteDepartment(id) {
  await Department.findOneAndDelete(withTenant({ id }));
  return { success: true };
}

export async function listTeams() {
  return TeamMember.find(withTenant())
    .sort({ name: 1 })
    .lean()
    .exec();
}

export async function updateTeamMember(id, patch) {
  const now = nowIso();
  const updated = await TeamMember.findOneAndUpdate(
    withTenant({ id }),
    { $set: { ...patch, updated_date: now } },
    { new: true },
  ).lean();

  if (!updated) {
    throw createHttpError(404, 'Team member not found', 'TEAM_MEMBER_NOT_FOUND');
  }
  return updated;
}

