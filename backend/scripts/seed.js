import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '../src/lib/db.js';
import { config } from '../src/config/index.js';
import {
  User,
  Department,
  TeamMember,
  WorkflowStage,
  Task,
  EmailMessage,
  Notification,
  NotificationPreference,
  RoutingRule,
  RolePageAccess,
  RolePermission,
  Subtask,
  Comment,
  TaskDependency,
  TaskApproval,
} from '../src/models/index.js';

// Reuse the rich mock data from the frontend
import { createMockDbSeed } from '../../gov-flow-ui-files-ref/src/api/mockSeed.js';

async function seedCollection(model, docs, { setTenant = false } = {}) {
  if (!docs || docs.length === 0) return;

  await model.deleteMany({});

  const withTenant = setTenant
    ? docs.map((doc) => ({
        tenantId: config.defaultTenantId,
        ...doc,
      }))
    : docs;

  await model.insertMany(withTenant);
}

async function run() {
  try {
    await connectDB({ required: true });

    const seed = createMockDbSeed();
    const entities = seed.entities || {};

    await seedCollection(User, entities.User, { setTenant: true });
    await seedCollection(Department, entities.Department, { setTenant: true });
    await seedCollection(TeamMember, entities.Teams, { setTenant: true });
    await seedCollection(WorkflowStage, entities.WorkflowStage, { setTenant: true });
    await seedCollection(Task, entities.Initiative, { setTenant: true });
    await seedCollection(EmailMessage, entities.EmailMessage, { setTenant: true });
    await seedCollection(Notification, entities.Notification, { setTenant: true });
    await seedCollection(NotificationPreference, entities.NotificationPreference, { setTenant: true });
    await seedCollection(RoutingRule, entities.RoutingRule, { setTenant: true });
    await seedCollection(RolePageAccess, entities.RolePageAccess, { setTenant: true });
    await seedCollection(RolePermission, entities.RolePermission, { setTenant: true });
    await seedCollection(Subtask, entities.Subtask, { setTenant: true });
    await seedCollection(Comment, entities.Comment, { setTenant: true });
    await seedCollection(TaskDependency, entities.TaskDependency, { setTenant: true });
    await seedCollection(TaskApproval, entities.TaskApproval, { setTenant: true });

    // eslint-disable-next-line no-console
    console.log('[seed] Database seeded successfully');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[seed] Error seeding database:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();

