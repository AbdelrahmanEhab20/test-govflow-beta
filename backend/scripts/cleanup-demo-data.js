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

/** Parse --keep-email=a@b.com (repeatable) or --keep-email a@b.com */
function parseKeepEmails(argv) {
  const emails = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--keep-email=')) {
      emails.push(arg.slice('--keep-email='.length));
    } else if (arg === '--keep-email' && argv[i + 1]) {
      emails.push(argv[i + 1]);
      i += 1;
    }
  }
  return [...new Set(emails.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean))];
}

const KEEP_EMAILS = parseKeepEmails(process.argv.slice(2));

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

async function countDocs(Model, filter = {}) {
  return Model.countDocuments(withTenant(filter));
}

async function run() {
  try {
    await connectDB({ required: true });

    let keepUsers;
    if (KEEP_EMAILS.length > 0) {
      keepUsers = await User.find(withTenant({ email: { $in: KEEP_EMAILS } }))
        .select('id email full_name role status')
        .lean()
        .exec();

      const found = new Set(keepUsers.map((u) => String(u.email || '').toLowerCase()));
      const missing = KEEP_EMAILS.filter((email) => !found.has(email));
      if (missing.length > 0) {
        throw new Error(
          `Aborting: keep-email not found in this tenant: ${missing.join(', ')}`
        );
      }
    } else {
      keepUsers = await User.find(withTenant({ role: 'admin' }))
        .select('id email full_name role status')
        .lean()
        .exec();
    }

    if (keepUsers.length === 0) {
      throw new Error(
        'Aborting: no users to keep. Pass --keep-email=... or ensure at least one admin exists.'
      );
    }

    const keepHasAdmin = keepUsers.some((u) => u.role === 'admin');
    if (!keepHasAdmin) {
      throw new Error(
        'Aborting: keep list has no admin user. At least one kept account must be role=admin.'
      );
    }

    const keepIds = keepUsers.map((u) => u.id);
    const usersToDelete = await User.find(
      withTenant({ id: { $nin: keepIds } })
    )
      .select('id email full_name role status')
      .lean()
      .exec();

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
      usersToDelete: usersToDelete.length,
      orphanPrefs: await NotificationPreference.countDocuments({
        ...withTenant(),
        user_id: { $nin: keepIds },
      }),
      departmentsWithStaleManager: await Department.countDocuments({
        ...withTenant(),
        manager_user_id: { $exists: true, $nin: [...keepIds, null, ''] },
      }),
    };

    console.log('Demo cleanup target tenant:', config.defaultTenantId);
    console.log('Mode:', APPLY_CHANGES ? 'APPLY' : 'DRY-RUN (pass --apply to mutate)');
    console.log('Flags:', {
      keepEmails: KEEP_EMAILS.length > 0 ? KEEP_EMAILS : '(default: all role=admin)',
      keepTeamMembers: KEEP_TEAM_MEMBERS,
      clearRoutingRules: CLEAR_ROUTING_RULES,
      resetMailboxes: RESET_MAILBOXES,
    });
    console.log('\nUsers to KEEP:');
    for (const user of keepUsers) {
      console.log(
        `  - ${user.email || user.id} (${user.full_name || 'no name'}) role=${user.role} [${user.status}]`
      );
    }
    console.log('\nUsers that WOULD BE DELETED:');
    if (usersToDelete.length === 0) {
      console.log('  (none)');
    } else {
      for (const user of usersToDelete) {
        console.log(
          `  - ${user.email || user.id} (${user.full_name || 'no name'}) role=${user.role}`
        );
      }
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

    deleted.users = (
      await User.deleteMany(withTenant({ id: { $nin: keepIds } }))
    ).deletedCount;

    deleted.orphanPrefs = (
      await NotificationPreference.deleteMany({
        ...withTenant(),
        user_id: { $nin: keepIds },
      })
    ).deletedCount;

    const deptResult = await Department.updateMany(
      {
        ...withTenant(),
        manager_user_id: { $exists: true, $nin: [...keepIds, null, ''] },
      },
      { $unset: { manager_user_id: 1, manager_name: 1 } }
    );
    deleted.staleDepartmentManagersCleared = deptResult.modifiedCount;

    if (RESET_MAILBOXES) {
      const mailboxResult = await User.updateMany(
        withTenant({ id: { $in: keepIds } }),
        { $set: { mailboxes: [] } }
      );
      deleted.keptUserMailboxesReset = mailboxResult.modifiedCount;
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
