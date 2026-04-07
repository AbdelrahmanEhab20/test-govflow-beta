import { Task, TeamMember, User, Department } from '../models/index.js';
import { config } from '../config/index.js';

function withTenant(filter = {}) {
  return { tenantId: config.defaultTenantId, ...filter };
}

function computeLeaderboard({ initiatives, teamMembers, users, departments, startDate, endDate, sector, department }) {
  const memberInfoMap = {};
  for (const m of teamMembers) {
    if (m?.name) memberInfoMap[m.name] = m;
  }
  const usersById = {};
  for (const u of users || []) {
    if (u?.id) usersById[u.id] = u;
  }
  const departmentSectorMap = {};
  for (const d of departments || []) {
    if (d?.name) departmentSectorMap[d.name] = d.sector || '';
  }

  const resolveMemberProfile = (taskOrMember = {}) => {
    const fromTeam = taskOrMember?.name ? memberInfoMap[taskOrMember.name] : null;
    const fromTaskLead = taskOrMember?.lead_user_name ? memberInfoMap[taskOrMember.lead_user_name] : null;
    const fromUser = taskOrMember?.lead_user_id ? usersById[taskOrMember.lead_user_id] : null;
    const source = fromTeam || fromTaskLead || {};
    const departmentName =
      source.department_name ||
      fromUser?.department ||
      taskOrMember?.department ||
      'Unknown';
    const sectorName =
      source.sector_name ||
      departmentSectorMap[departmentName] ||
      'Unknown';
    return {
      job_title: source.job_title || fromUser?.position || '',
      department: departmentName,
      sector: sectorName,
    };
  };

  let filtered = (initiatives || []).filter((i) => !i.is_archived);
  if (startDate) filtered = filtered.filter((i) => !i.due_date || i.due_date >= startDate);
  if (endDate) filtered = filtered.filter((i) => !i.due_date || i.due_date <= endDate);

  if (sector || department) {
    filtered = filtered.filter((i) => {
      const m = resolveMemberProfile(i);
      if (sector && m.sector !== sector) return false;
      if (department && m.department !== department) return false;
      return true;
    });
  }

  const memberStats = {};
  for (const m of teamMembers || []) {
    if (!m?.name) continue;
    const profile = resolveMemberProfile({ name: m.name });
    memberStats[m.name] = {
      name: m.name,
      job_title: profile.job_title,
      department: profile.department,
      sector: profile.sector,
      total: 0,
      completed: 0,
      in_progress: 0,
      delayed: 0,
      total_completion_percent: 0,
      on_time_completions: 0,
    };
  }

  for (const init of filtered) {
    const name = init.lead_user_name;
    if (!name) continue;
    if (!memberStats[name]) {
      const profile = resolveMemberProfile(init);
      memberStats[name] = {
        name,
        job_title: profile.job_title,
        department: profile.department,
        sector: profile.sector,
        total: 0,
        completed: 0,
        in_progress: 0,
        delayed: 0,
        total_completion_percent: 0,
        on_time_completions: 0,
      };
    }
    const s = memberStats[name];
    s.total += 1;
    s.total_completion_percent += init.completion_percent || 0;
    if (init.status === 'completed') {
      s.completed += 1;
      const dueOk =
        !init.due_date ||
        !init.updated_date ||
        new Date(init.updated_date) <= new Date(init.due_date);
      if (dueOk) s.on_time_completions += 1;
    }
    if (init.status === 'in_progress') s.in_progress += 1;
    if (init.status === 'delayed') s.delayed += 1;
  }

  const teamMembersLeaderboard = Object.values(memberStats)
    .filter((m) => m.total > 0)
    .map((m) => ({
      ...m,
      completion_rate: Math.round((m.completed / m.total) * 100),
      avg_completion_percent: Math.round(m.total_completion_percent / m.total),
      on_time_rate:
        m.completed > 0 ? Math.round((m.on_time_completions / m.completed) * 100) : 0,
      score: Math.round(
        (m.completed / m.total) * 60 + m.completed * 3 + (m.total_completion_percent / m.total) * 0.4,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const deptStats = {};
  for (const m of teamMembersLeaderboard) {
    const key = m.department;
    if (!deptStats[key]) {
      deptStats[key] = {
        name: key,
        sector: m.sector,
        members: new Set(),
        total: 0,
        completed: 0,
        in_progress: 0,
        delayed: 0,
        total_rate_sum: 0,
      };
    }
    const d = deptStats[key];
    d.members.add(m.name);
    d.total += m.total;
    d.completed += m.completed;
    d.in_progress += m.in_progress;
    d.delayed += m.delayed;
    d.total_rate_sum += m.completion_rate;
  }

  const departmentsLeaderboard = Object.values(deptStats)
    .map((d) => ({
      name: d.name,
      sector: d.sector,
      member_count: d.members.size,
      total: d.total,
      completed: d.completed,
      in_progress: d.in_progress,
      delayed: d.delayed,
      completion_rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      avg_member_rate: d.members.size > 0 ? Math.round(d.total_rate_sum / d.members.size) : 0,
      score: Math.round(
        (d.completed / (d.total || 1)) * 60 + d.completed * 2 + d.members.size * 0.5,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const sectorStats = {};
  for (const d of departmentsLeaderboard) {
    const key = d.sector || 'Unknown';
    if (!sectorStats[key]) {
      sectorStats[key] = {
        name: key,
        dept_count: 0,
        member_count: 0,
        total: 0,
        completed: 0,
        in_progress: 0,
        delayed: 0,
        rate_sum: 0,
      };
    }
    const s = sectorStats[key];
    s.dept_count += 1;
    s.member_count += d.member_count;
    s.total += d.total;
    s.completed += d.completed;
    s.in_progress += d.in_progress;
    s.delayed += d.delayed;
    s.rate_sum += d.completion_rate;
  }

  const sectorsLeaderboard = Object.values(sectorStats)
    .map((s) => ({
      name: s.name,
      dept_count: s.dept_count,
      member_count: s.member_count,
      total: s.total,
      completed: s.completed,
      in_progress: s.in_progress,
      delayed: s.delayed,
      completion_rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      avg_dept_rate: s.dept_count > 0 ? Math.round(s.rate_sum / s.dept_count) : 0,
      score: Math.round(
        (s.completed / (s.total || 1)) * 60 + s.completed * 1.5 + s.member_count * 0.3,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    teamMembers: teamMembersLeaderboard,
    departments: departmentsLeaderboard,
    sectors: sectorsLeaderboard,
  };
}

export async function getLeaderboardData(params = {}) {
  const initiatives = await Task.find(withTenant()).lean().exec();
  const teamMembers = await TeamMember.find(withTenant()).lean().exec();
  const users = await User.find(withTenant()).lean().exec();
  const departments = await Department.find(withTenant()).lean().exec();
  return computeLeaderboard({
    initiatives,
    teamMembers,
    users,
    departments,
    startDate: params.startDate,
    endDate: params.endDate,
    sector: params.sector,
    department: params.department,
  });
}

export async function analyzeTeamPerformance(params = {}) {
  const initiatives = params.initiatives || [];
  const overdue = initiatives.filter((i) => i.status === 'delayed').length;
  const completed = initiatives.filter((i) => i.status === 'completed').length;

  const insights = [
    {
      title: 'Completion overview',
      description: `${completed} completed out of ${initiatives.length}.`,
      severity: 'info',
    },
  ];

  const recommendations = [
    {
      title: 'Focus on overdue items',
      description: overdue
        ? 'Rebalance workload to reduce delayed tasks.'
        : 'Current cadence looks healthy; maintain focus on timely delivery.',
      impact: overdue ? 'high' : 'low',
    },
  ];

  const alerts = overdue
    ? [
        {
          title: 'Overdue tasks detected',
          description: `${overdue} tasks are marked delayed.`,
          severity: 'warning',
          action: 'Review owners and due dates.',
        },
      ]
    : [];

  return { insights, recommendations, alerts };
}

