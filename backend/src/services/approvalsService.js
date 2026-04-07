import { v4 as uuidv4 } from 'uuid';
import { Task, TaskApproval, Notification, User } from '../models/index.js';
import { config } from '../config/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function nowIso() {
  return new Date().toISOString();
}

export async function listTaskApprovals(taskId) {
  return TaskApproval.find(withTenant({ task_id: taskId }))
    .sort({ created_date: 1 })
    .lean()
    .exec();
}

/**
 * Submit a task for approval.
 * MVP behaviour mirrors the mock implementation:
 * - validates task exists and requires approval
 * - creates pending TaskApproval records for approver users
 * - creates Notification records for each approver
 * - updates task.approval_status → "submitted"
 */
export async function submitForApproval(taskId) {
  if (!taskId) {
    throw createHttpError(400, 'Missing taskId', 'MISSING_TASK_ID');
  }

  const task = await Task.findOne(withTenant({ id: taskId })).lean();
  if (!task) {
    throw createHttpError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  if (!task.requires_approval) {
    throw createHttpError(400, 'Task does not require approval', 'TASK_NO_APPROVAL_REQUIRED');
  }

  // Choose approvers: for now, all users with admin/manager-style roles.
  const approverRoles = ['admin', 'department_admin', 'department_manager'];
  const approvers = await User.find(
    withTenant({ role: { $in: approverRoles } }),
  )
    .lean()
    .exec();

  if (!approvers.length) {
    throw createHttpError(400, 'No approvers available', 'NO_APPROVERS');
  }

  const now = nowIso();

  const approvals = [];
  const notifications = [];

  approvers.forEach((approver, index) => {
    const approvalId = `ta_${Date.now()}_${index}_${uuidv4()}`;
    approvals.push({
      id: approvalId,
      tenantId: config.defaultTenantId,
      task_id: taskId,
      approver_user_id: approver.id,
      approver_user_name: approver.full_name,
      status: 'pending',
      sequence_order: index,
      is_sequential: true,
      created_date: now,
      updated_date: now,
    });

    notifications.push({
      id: `notif_${Date.now()}_${index}_${uuidv4()}`,
      tenantId: config.defaultTenantId,
      user_id: approver.id,
      type: 'approval_required',
      title: 'Task Approval Required',
      message: `Approval needed for: ${task.pillar}`,
      is_read: false,
      created_date: now,
      updated_date: now,
    });
  });

  await TaskApproval.insertMany(approvals);
  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  await Task.findOneAndUpdate(
    withTenant({ id: taskId }),
    { $set: { approval_status: 'submitted', updated_date: now } },
  );

  return {
    success: true,
    approvals,
    message: 'Task submitted for approval',
  };
}

