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

function collectDescendantIds(parentId, departments) {
  const descendants = [];
  const children = departments.filter((dept) => dept.parent_department_id === parentId);
  for (const child of children) {
    descendants.push(child.id);
    descendants.push(...collectDescendantIds(child.id, departments));
  }
  return descendants;
}

function getParentId(dept) {
  return dept?.parent_department_id || null;
}

function compareDepartments(a, b) {
  const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return String(a.name || '').localeCompare(String(b.name || ''));
}

async function getAllDepartments() {
  return Department.find(withTenant()).lean().exec();
}

async function getNextSortOrder(parentDepartmentId) {
  const normalizedParent = parentDepartmentId || null;
  const siblings = (await getAllDepartments()).filter(
    (dept) => getParentId(dept) === normalizedParent,
  );
  if (siblings.length === 0) return 0;
  const maxOrder = siblings.reduce(
    (max, dept) => Math.max(max, dept.sort_order ?? 0),
    -1,
  );
  return maxOrder + 1;
}

export async function listDepartments() {
  const departments = await getAllDepartments();
  return [...departments].sort(compareDepartments);
}

export async function createDepartment(data) {
  const now = nowIso();
  const parentDepartmentId = data.parent_department_id || null;
  const sortOrder =
    data.sort_order !== undefined
      ? data.sort_order
      : await getNextSortOrder(parentDepartmentId);

  const doc = await Department.create({
    id: data.id || uuidv4(),
    tenantId: config.defaultTenantId,
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    sort_order: sortOrder,
    ...data,
  });
  return doc.toObject();
}

export async function moveDepartmentInHierarchy(departmentId, parentDepartmentId, sortIndex) {
  const normalizedParent = parentDepartmentId || null;
  const allDepartments = await getAllDepartments();
  const department = allDepartments.find((dept) => dept.id === departmentId);

  if (!department) {
    throw createHttpError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
  }

  if (normalizedParent === departmentId) {
    throw createHttpError(400, 'Department cannot be its own parent', 'INVALID_HIERARCHY');
  }

  if (normalizedParent) {
    const parentExists = allDepartments.some((dept) => dept.id === normalizedParent);
    if (!parentExists) {
      throw createHttpError(404, 'Parent department not found', 'DEPARTMENT_NOT_FOUND');
    }
    const descendants = collectDescendantIds(departmentId, allDepartments);
    if (descendants.includes(normalizedParent)) {
      throw createHttpError(
        400,
        'Cannot move department under its own descendant',
        'INVALID_HIERARCHY',
      );
    }
  }

  const siblings = allDepartments
    .filter((dept) => getParentId(dept) === normalizedParent && dept.id !== departmentId)
    .sort(compareDepartments);

  const orderedIds = siblings.map((dept) => dept.id);
  const clampedIndex = Math.max(0, Math.min(sortIndex, orderedIds.length));
  orderedIds.splice(clampedIndex, 0, departmentId);

  const parentName = normalizedParent
    ? allDepartments.find((dept) => dept.id === normalizedParent)?.name || ''
    : '';
  const now = nowIso();

  await Promise.all(
    orderedIds.map((id, index) => {
      const patch = {
        sort_order: index,
        updated_date: now,
      };
      if (id === departmentId) {
        patch.parent_department_id = normalizedParent;
        patch.parent_department_name = parentName;
      }
      return Department.findOneAndUpdate(withTenant({ id }), { $set: patch }).exec();
    }),
  );

  return Department.findOne(withTenant({ id: departmentId })).lean().exec();
}

export async function updateDepartment(id, patch) {
  const now = nowIso();

  if (Object.prototype.hasOwnProperty.call(patch, 'parent_department_id')) {
    const newParentId = patch.parent_department_id || null;
    if (newParentId === id) {
      throw createHttpError(400, 'Department cannot be its own parent', 'INVALID_HIERARCHY');
    }
    if (newParentId) {
      const allDepartments = await Department.find(withTenant()).lean().exec();
      const parentExists = allDepartments.some((dept) => dept.id === newParentId);
      if (!parentExists) {
        throw createHttpError(404, 'Parent department not found', 'DEPARTMENT_NOT_FOUND');
      }
      const descendants = collectDescendantIds(id, allDepartments);
      if (descendants.includes(newParentId)) {
        throw createHttpError(
          400,
          'Cannot move department under its own descendant',
          'INVALID_HIERARCHY',
        );
      }
    }
  }

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

