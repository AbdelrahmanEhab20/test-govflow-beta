import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '../src/lib/db.js';
import { config } from '../src/config/index.js';
import { Department, TeamMember, User } from '../src/models/index.js';

const APPLY_CHANGES = process.argv.includes('--apply');

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function buildCanonicalContext(departments = []) {
  const canonicalByLower = new Map();
  const sectorByDepartment = new Map();
  for (const department of departments) {
    const name = String(department?.name || '').trim();
    if (!name) continue;
    canonicalByLower.set(name.toLowerCase(), name);
    sectorByDepartment.set(name, String(department?.sector || '').trim());
  }
  const fallbackDepartment =
    canonicalByLower.get('development') ||
    (canonicalByLower.size > 0 ? [...canonicalByLower.values()][0] : null);
  return { canonicalByLower, sectorByDepartment, fallbackDepartment };
}

function normalizeDepartment(rawDepartment, context) {
  const normalized = String(rawDepartment || '').trim();
  if (!normalized) return context.fallbackDepartment;
  return context.canonicalByLower.get(normalized.toLowerCase()) || context.fallbackDepartment;
}

async function run() {
  try {
    await connectDB({ required: true });

    const departments = await Department.find(withTenant()).lean().exec();
    const context = buildCanonicalContext(departments);
    if (!context.fallbackDepartment) {
      throw new Error('No departments found. Cannot normalize values without canonical department records.');
    }

    const users = await User.find(withTenant()).lean().exec();
    const teamMembers = await TeamMember.find(withTenant()).lean().exec();

    const userOps = [];
    for (const user of users) {
      const nextDepartment = normalizeDepartment(user.department, context);
      if (nextDepartment && nextDepartment !== (user.department || '')) {
        userOps.push({
          updateOne: {
            filter: withTenant({ id: user.id }),
            update: { $set: { department: nextDepartment, updated_date: new Date().toISOString() } },
          },
        });
      }
    }

    const teamMemberOps = [];
    for (const member of teamMembers) {
      const nextDepartment = normalizeDepartment(member.department_name, context);
      const nextSector = nextDepartment ? context.sectorByDepartment.get(nextDepartment) || '' : '';
      const shouldUpdateDepartment = nextDepartment && nextDepartment !== (member.department_name || '');
      const shouldUpdateSector = nextSector !== (member.sector_name || '');
      if (shouldUpdateDepartment || shouldUpdateSector) {
        teamMemberOps.push({
          updateOne: {
            filter: withTenant({ id: member.id }),
            update: {
              $set: {
                ...(shouldUpdateDepartment ? { department_name: nextDepartment } : {}),
                sector_name: nextSector,
                updated_date: new Date().toISOString(),
              },
            },
          },
        });
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[normalize-departments] Mode: ${APPLY_CHANGES ? 'apply' : 'dry-run'}`);
    // eslint-disable-next-line no-console
    console.log(`[normalize-departments] Fallback department: ${context.fallbackDepartment}`);
    // eslint-disable-next-line no-console
    console.log(`[normalize-departments] Users to update: ${userOps.length}`);
    // eslint-disable-next-line no-console
    console.log(`[normalize-departments] Team members to update: ${teamMemberOps.length}`);

    if (!APPLY_CHANGES) {
      // eslint-disable-next-line no-console
      console.log('[normalize-departments] Dry-run complete. Re-run with --apply to persist changes.');
      return;
    }

    if (userOps.length > 0) {
      await User.bulkWrite(userOps, { ordered: false });
    }
    if (teamMemberOps.length > 0) {
      await TeamMember.bulkWrite(teamMemberOps, { ordered: false });
    }

    // eslint-disable-next-line no-console
    console.log('[normalize-departments] Normalization completed successfully.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[normalize-departments] Failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
