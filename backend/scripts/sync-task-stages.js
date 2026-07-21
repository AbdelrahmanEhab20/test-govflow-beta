import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '../src/lib/db.js';
import { config } from '../src/config/index.js';
import { Task, WorkflowStage } from '../src/models/index.js';

const APPLY_CHANGES = process.argv.includes('--apply');

const STAGE_TO_STATUS = {
  Planning: 'not_started',
  Pipeline: 'not_started',
  'In Progress': 'in_progress',
  'In Review': 'in_progress',
  Review: 'in_progress',
  Completed: 'completed',
  Approved: 'completed',
  Done: 'completed',
  'On Hold': 'on_hold',
};

const STATUS_TO_STAGE_NAMES = {
  not_started: ['Pipeline', 'Planning'],
  in_progress: ['In Progress'],
  completed: ['Completed', 'Approved', 'Done'],
  on_hold: ['On Hold'],
};

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function findStageByNames(stages, names = []) {
  for (const name of names) {
    const match = stages.find((stage) => stage?.name === name);
    if (match) return match;
  }
  return null;
}

function getStageIdForStatus(status, stages) {
  const names = STATUS_TO_STAGE_NAMES[status];
  if (!names?.length) return null;
  return findStageByNames(stages, names)?.id || null;
}

function stageStatus(stage) {
  if (!stage?.name) return null;
  return STAGE_TO_STATUS[stage.name] || null;
}

async function run() {
  try {
    await connectDB({ required: true });

    const stages = await WorkflowStage.find(withTenant({ is_active: true }))
      .lean()
      .exec();
    const stageById = new Map(stages.map((stage) => [stage.id, stage]));

    if (stages.length === 0) {
      throw new Error('No active workflow stages found. Cannot repair task stage alignment.');
    }

    const tasks = await Task.find(withTenant()).lean().exec();
    const ops = [];
    const samples = [];

    for (const task of tasks) {
      const currentStage = stageById.get(task.workflow_stage_id);
      const currentStageStatus = stageStatus(currentStage);
      const status = task.status || 'not_started';
      const patch = {};

      // Completed (or any status) whose stage maps to a different status → move stage
      if (STATUS_TO_STAGE_NAMES[status]) {
        const expectedStageId = getStageIdForStatus(status, stages);
        if (
          expectedStageId &&
          task.workflow_stage_id !== expectedStageId &&
          // Only auto-move when stage is missing, or stage's mapped status disagrees
          (!currentStage || (currentStageStatus && currentStageStatus !== status))
        ) {
          // Special case: in_progress may live in In Review / Review — leave those alone
          if (
            status === 'in_progress' &&
            (currentStage?.name === 'In Review' || currentStage?.name === 'Review')
          ) {
            // keep In Review for in_progress
          } else {
            patch.workflow_stage_id = expectedStageId;
          }
        }
      }

      if (status === 'completed' && (Number(task.completion_percent) || 0) < 100) {
        patch.completion_percent = 100;
      }

      if (Object.keys(patch).length > 0) {
        ops.push({
          updateOne: {
            filter: withTenant({ id: task.id }),
            update: {
              $set: {
                ...patch,
                updated_date: new Date().toISOString(),
              },
            },
          },
        });
        if (samples.length < 15) {
          samples.push({
            id: task.id,
            pillar: task.pillar,
            status,
            fromStage: currentStage?.name || task.workflow_stage_id || '(none)',
            toStage: patch.workflow_stage_id
              ? stageById.get(patch.workflow_stage_id)?.name || patch.workflow_stage_id
              : undefined,
            completion_percent: patch.completion_percent,
          });
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[sync-task-stages] Mode: ${APPLY_CHANGES ? 'apply' : 'dry-run'}`);
    // eslint-disable-next-line no-console
    console.log(`[sync-task-stages] Tenant: ${config.defaultTenantId}`);
    // eslint-disable-next-line no-console
    console.log(`[sync-task-stages] Tasks scanned: ${tasks.length}`);
    // eslint-disable-next-line no-console
    console.log(`[sync-task-stages] Tasks to update: ${ops.length}`);
    if (samples.length > 0) {
      // eslint-disable-next-line no-console
      console.log('[sync-task-stages] Sample updates:', JSON.stringify(samples, null, 2));
    }

    if (!APPLY_CHANGES) {
      // eslint-disable-next-line no-console
      console.log('[sync-task-stages] Dry-run complete. Re-run with --apply to persist changes.');
      return;
    }

    if (ops.length > 0) {
      await Task.bulkWrite(ops, { ordered: false });
    }

    // eslint-disable-next-line no-console
    console.log('[sync-task-stages] Sync completed successfully.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[sync-task-stages] Failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
