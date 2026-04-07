import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { startDate, endDate, sector, department } = await req.json();

    const [initiatives, teamMembers] = await Promise.all([
      base44.entities.Initiative.list(),
      base44.entities.Teams.list(),
    ]);

    // Build name -> member map
    const memberInfoMap = {};
    teamMembers.forEach(m => {
      if (m.name) memberInfoMap[m.name] = m;
    });

    // Apply date filters
    let filtered = initiatives.filter(i => !i.is_archived);
    if (startDate) filtered = filtered.filter(i => !i.due_date || i.due_date >= startDate);
    if (endDate)   filtered = filtered.filter(i => !i.due_date || i.due_date <= endDate);

    // Apply sector / department filters
    if (sector || department) {
      filtered = filtered.filter(i => {
        const m = memberInfoMap[i.lead_user_name];
        if (!m) return false;
        if (sector && m.sector_name !== sector) return false;
        if (department && m.department_name !== department) return false;
        return true;
      });
    }

    // ── Team Member metrics ──
    const memberStats = {};

    teamMembers.forEach(m => {
      if (!m.name) return;
      memberStats[m.name] = {
        name: m.name,
        job_title: m.job_title || '',
        department: m.department_name || 'Unknown',
        sector: m.sector_name || 'Unknown',
        total: 0, completed: 0, in_progress: 0, delayed: 0,
        total_completion_percent: 0, on_time_completions: 0,
      };
    });

    filtered.forEach(init => {
      const name = init.lead_user_name;
      if (!name) return;
      if (!memberStats[name]) {
        const m = memberInfoMap[name] || {};
        memberStats[name] = {
          name,
          job_title: m.job_title || '',
          department: m.department_name || 'Unknown',
          sector: m.sector_name || 'Unknown',
          total: 0, completed: 0, in_progress: 0, delayed: 0,
          total_completion_percent: 0, on_time_completions: 0,
        };
      }
      const s = memberStats[name];
      s.total++;
      s.total_completion_percent += (init.completion_percent || 0);
      if (init.status === 'completed') {
        s.completed++;
        const dueOk = !init.due_date || !init.updated_date ||
          new Date(init.updated_date) <= new Date(init.due_date);
        if (dueOk) s.on_time_completions++;
      }
      if (init.status === 'in_progress') s.in_progress++;
      if (init.status === 'delayed')     s.delayed++;
    });

    const teamMembersLeaderboard = Object.values(memberStats)
      .filter(m => m.total > 0)
      .map(m => ({
        ...m,
        completion_rate: Math.round((m.completed / m.total) * 100),
        avg_completion_percent: Math.round(m.total_completion_percent / m.total),
        on_time_rate: m.completed > 0 ? Math.round((m.on_time_completions / m.completed) * 100) : 0,
        score: Math.round(((m.completed / m.total) * 60) + (m.completed * 3) + (m.total_completion_percent / m.total) * 0.4),
      }))
      .sort((a, b) => b.score - a.score);

    // ── Department metrics ──
    const deptStats = {};
    teamMembersLeaderboard.forEach(m => {
      const key = m.department;
      if (!deptStats[key]) {
        deptStats[key] = { name: key, sector: m.sector, members: new Set(), total: 0, completed: 0, in_progress: 0, delayed: 0, total_rate_sum: 0 };
      }
      const d = deptStats[key];
      d.members.add(m.name);
      d.total     += m.total;
      d.completed += m.completed;
      d.in_progress += m.in_progress;
      d.delayed   += m.delayed;
      d.total_rate_sum += m.completion_rate;
    });

    const departmentsLeaderboard = Object.values(deptStats)
      .map(d => ({
        name: d.name,
        sector: d.sector,
        member_count: d.members.size,
        total: d.total,
        completed: d.completed,
        in_progress: d.in_progress,
        delayed: d.delayed,
        completion_rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        avg_member_rate: d.members.size > 0 ? Math.round(d.total_rate_sum / d.members.size) : 0,
        score: Math.round(((d.completed / (d.total || 1)) * 60) + (d.completed * 2) + d.members.size * 0.5),
      }))
      .sort((a, b) => b.score - a.score);

    // ── Sector metrics ──
    const sectorStats = {};
    departmentsLeaderboard.forEach(d => {
      const key = d.sector || 'Unknown';
      if (!sectorStats[key]) {
        sectorStats[key] = { name: key, dept_count: 0, member_count: 0, total: 0, completed: 0, in_progress: 0, delayed: 0, rate_sum: 0 };
      }
      const s = sectorStats[key];
      s.dept_count++;
      s.member_count += d.member_count;
      s.total     += d.total;
      s.completed += d.completed;
      s.in_progress += d.in_progress;
      s.delayed   += d.delayed;
      s.rate_sum  += d.completion_rate;
    });

    const sectorsLeaderboard = Object.values(sectorStats)
      .map(s => ({
        name: s.name,
        dept_count: s.dept_count,
        member_count: s.member_count,
        total: s.total,
        completed: s.completed,
        in_progress: s.in_progress,
        delayed: s.delayed,
        completion_rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
        avg_dept_rate: s.dept_count > 0 ? Math.round(s.rate_sum / s.dept_count) : 0,
        score: Math.round(((s.completed / (s.total || 1)) * 60) + (s.completed * 1.5) + s.member_count * 0.3),
      }))
      .sort((a, b) => b.score - a.score);

    return Response.json({ teamMembers: teamMembersLeaderboard, departments: departmentsLeaderboard, sectors: sectorsLeaderboard });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});