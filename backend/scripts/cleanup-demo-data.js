import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '../src/lib/db.js';
import { config } from '../src/config/index.js';
import {
  User,
  Task,
  Subtask,
  Comment,
  TaskApproval,
  TaskDependency,
  EmailMessage,
  Notification,
  NotificationPreference,
  TeamMember,
  RoutingRule,
  Department,
} from '../src/models/index.js';

const APPLY_CHANGES = process.argv.includes('--apply');
const KEEP_TEAM_MEMBERS = process.argv.includes('--keep-team-members');
const CLEAR_ROUTING_RULES = process.argv.includes('--clear-routing-rules');
const RESET_MAILBOXES = process.argv.includes('--reset-mailboxes');

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

async function countDocs(Model, filter = {}) {
  return Model.countDocuments(withTenant(filter));
}

async function run() {
  try {
    await connectDB({ required: true });

    const admins = await User.find(withTenant({ role: 'admin' }))
      .select('id email full_name role status')
      .lean()
      .exec();

    if (admins.length === 0) {
      throw new Error(
        'Aborting: no admin users found for this tenant. Refusing to delete non-admins with zero admins remaining.'
      );
    }

    const adminIds = admins.map((u) => u.id);

    const counts = {
      subtasks: await countDocs(Subtask),
      comments: await countDocs(Comment),
      taskApprovals: await countDocs(TaskApproval),
      taskDependencies: await countDocs(TaskDependency),
      tasks: await countDocs(Task),
      emailMessages: await countDocs(EmailMessage),
      notifications: await countDocs(Notification),
      teamMembers: await countDocs(TeamMember),
      routingRules: await countDocs(RoutingRule),
      nonAdminUsers: await countDocs(User, { role: { $ne: 'admin' } }),
      orphanPrefs: await NotificationPreference.countDocuments({
        ...withTenant(),
        user_id: { $nin: adminIds },
      }),
      departmentsWithStaleManager: await Department.countDocuments({
        ...withTenant(),
        manager_user_id: { $exists: true, $nin: [...adminIds, null, ''] },
      }),
    };

    console.log('Demo cleanup target tenant:', config.defaultTenantId);
    console.log('Mode:', APPLY_CHANGES ? 'APPLY' : 'DRY-RUN (pass --apply to mutate)');
    console.log('Flags:', {
      keepTeamMembers: KEEP_TEAM_MEMBERS,
      clearRoutingRules: CLEAR_ROUTING_RULES,
      resetMailboxes: RESET_MAILBOXES,
    });
    console.log('\nAdmins to KEEP:');
    for (const admin of admins) {
      console.log(`  - ${admin.email || admin.id} (${admin.full_name || 'no name'}) [${admin.status}]`);
    }
    console.log('\nCounts to clear:');
    console.table(counts);

    if (!APPLY_CHANGES) {
      console.log('\nDry-run complete. Re-run with --apply to delete the counts above.');
      return;
    }

    const deleted = {};

    deleted.subtasks = (await Subtask.deleteMany(withTenant())).deletedCount;
    deleted.comments = (await Comment.deleteMany(withTenant())).deletedCount;
    deleted.taskApprovals = (await TaskApproval.deleteMany(withTenant())).deletedCount;
    deleted.taskDependencies = (await TaskDependency.deleteMany(withTenant())).deletedCount;
    deleted.tasks = (await Task.deleteMany(withTenant())).deletedCount;
    deleted.emailMessages = (await EmailMessage.deleteMany(withTenant())).deletedCount;
    deleted.notifications = (await Notification.deleteMany(withTenant())).deletedCount;

    if (!KEEP_TEAM_MEMBERS) {
      deleted.teamMembers = (await TeamMember.deleteMany(withTenant())).deletedCount;
    } else {
      deleted.teamMembers = 0;
    }

    if (CLEAR_ROUTING_RULES) {
      deleted.routingRules = (await RoutingRule.deleteMany(withTenant())).deletedCount;
    } else {
      deleted.routingRules = 0;
    }

    deleted.nonAdminUsers = (
      await User.deleteMany(withTenant({ role: { $ne: 'admin' } }))
    ).deletedCount;

    deleted.orphanPrefs = (
      await NotificationPreference.deleteMany({
        ...withTenant(),
        user_id: { $nin: adminIds },
      })
    ).deletedCount;

    const deptResult = await Department.updateMany(
      {
        ...withTenant(),
        manager_user_id: { $exists: true, $nin: [...adminIds, null, ''] },
      },
      { $unset: { manager_user_id: 1, manager_name: 1 } }
    );
    deleted.staleDepartmentManagersCleared = deptResult.modifiedCount;

    if (RESET_MAILBOXES) {
      const mailboxResult = await User.updateMany(
        withTenant({ role: 'admin' }),
        { $set: { mailboxes: [] } }
      );
      deleted.adminMailboxesReset = mailboxResult.modifiedCount;
    }

    console.log('\nDeleted:');
    console.table(deleted);
    console.log('\nDemo cleanup applied. Invite demo members or seed sample tasks as needed.');
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run().catch((error) => {
  console.error('cleanup-demo-data failed:', error.message || error);
  process.exitCode = 1;
});
