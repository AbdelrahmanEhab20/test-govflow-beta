import { entityApi, loadMockDb, saveMockDb } from "./mockDb";

function ok(data) {
  return Promise.resolve({ data });
}

function ensureUserNameFields(task, users) {
  const lead = users.find((u) => u.id === task.lead_user_id);
  const support = (task.support_users || [])
    .map((id) => users.find((u) => u.id === id)?.full_name)
    .filter(Boolean);
  return {
    ...task,
    lead_user_name: task.lead_user_name || lead?.full_name || "",
    support_user_names: task.support_user_names || support,
  };
}

function scoreUserForTask(user, task, openTaskCount) {
  let score = 70;
  if (user.department && task?.pillar?.toLowerCase().includes(user.department.toLowerCase())) score += 5;
  if ((task?.priority === "urgent" || task?.priority === "high") && user.role?.includes("manager")) score += 5;
  score -= Math.min(openTaskCount * 5, 30);
  return Math.max(40, Math.min(99, score));
}

function computeLeaderboard({ initiatives, teamMembers, startDate, endDate, sector, department }) {
  const memberInfoMap = {};
  for (const m of teamMembers) {
    if (m?.name) memberInfoMap[m.name] = m;
  }

  let filtered = (initiatives || []).filter((i) => !i.is_archived);
  if (startDate) filtered = filtered.filter((i) => !i.due_date || i.due_date >= startDate);
  if (endDate) filtered = filtered.filter((i) => !i.due_date || i.due_date <= endDate);

  if (sector || department) {
    filtered = filtered.filter((i) => {
      const m = memberInfoMap[i.lead_user_name];
      if (!m) return false;
      if (sector && m.sector_name !== sector) return false;
      if (department && m.department_name !== department) return false;
      return true;
    });
  }

  const memberStats = {};
  for (const m of teamMembers || []) {
    if (!m?.name) continue;
    memberStats[m.name] = {
      name: m.name,
      job_title: m.job_title || "",
      department: m.department_name || "Unknown",
      sector: m.sector_name || "Unknown",
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
      const m = memberInfoMap[name] || {};
      memberStats[name] = {
        name,
        job_title: m.job_title || "",
        department: m.department_name || "Unknown",
        sector: m.sector_name || "Unknown",
        total: 0,
        completed: 0,
        in_progress: 0,
        delayed: 0,
        total_completion_percent: 0,
        on_time_completions: 0,
      };
    }
    const s = memberStats[name];
    s.total++;
    s.total_completion_percent += init.completion_percent || 0;
    if (init.status === "completed") {
      s.completed++;
      const dueOk =
        !init.due_date ||
        !init.updated_date ||
        new Date(init.updated_date) <= new Date(init.due_date);
      if (dueOk) s.on_time_completions++;
    }
    if (init.status === "in_progress") s.in_progress++;
    if (init.status === "delayed") s.delayed++;
  }

  const teamMembersLeaderboard = Object.values(memberStats)
    .filter((m) => m.total > 0)
    .map((m) => ({
      ...m,
      completion_rate: Math.round((m.completed / m.total) * 100),
      avg_completion_percent: Math.round(m.total_completion_percent / m.total),
      on_time_rate: m.completed > 0 ? Math.round((m.on_time_completions / m.completed) * 100) : 0,
      score: Math.round((m.completed / m.total) * 60 + m.completed * 3 + (m.total_completion_percent / m.total) * 0.4),
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
      score: Math.round((d.completed / (d.total || 1)) * 60 + d.completed * 2 + d.members.size * 0.5),
    }))
    .sort((a, b) => b.score - a.score);

  const sectorStats = {};
  for (const d of departmentsLeaderboard) {
    const key = d.sector || "Unknown";
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
    s.dept_count++;
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
      score: Math.round((s.completed / (s.total || 1)) * 60 + s.completed * 1.5 + s.member_count * 0.3),
    }))
    .sort((a, b) => b.score - a.score);

  return { teamMembers: teamMembersLeaderboard, departments: departmentsLeaderboard, sectors: sectorsLeaderboard };
}

export function createMockBase44Client() {
  const entities = {
    User: entityApi("User"),
    Department: entityApi("Department"),
    Teams: entityApi("Teams"),
    WorkflowStage: entityApi("WorkflowStage"),
    Initiative: entityApi("Initiative"),
    EmailMessage: entityApi("EmailMessage"),
    Notification: entityApi("Notification"),
    NotificationPreference: entityApi("NotificationPreference"),
    RoutingRule: entityApi("RoutingRule"),
    RolePageAccess: entityApi("RolePageAccess"),
    RolePermission: entityApi("RolePermission"),
    Subtask: entityApi("Subtask"),
    Comment: entityApi("Comment"),
    TaskDependency: entityApi("TaskDependency"),
    TaskApproval: entityApi("TaskApproval"),
  };

  const auth = {
    me: async () => {
      const db = loadMockDb();
      const users = db.entities.User || [];
      const id = db.auth?.currentUserId || users[0]?.id;
      const u = users.find((x) => x.id === id) || users[0] || null;
      if (!u) {
        const err = new Error("No mock users available");
        err.status = 500;
        throw err;
      }
      return JSON.parse(JSON.stringify(u));
    },

    updateMe: async (patch) => {
      const db = loadMockDb();
      const id = db.auth?.currentUserId;
      if (!id) {
        const err = new Error("Not authenticated (mock)");
        err.status = 401;
        throw err;
      }
      const idx = db.entities.User.findIndex((u) => u.id === id);
      if (idx === -1) {
        const err = new Error("Current user not found (mock)");
        err.status = 404;
        throw err;
      }
      db.entities.User[idx] = { ...db.entities.User[idx], ...patch, updated_date: new Date().toISOString() };
      saveMockDb(db);
      return JSON.parse(JSON.stringify(db.entities.User[idx]));
    },

    logout: () => {
      const db = loadMockDb();
      db.auth.currentUserId = "";
      saveMockDb(db);
    },

    redirectToLogin: (fromUrl) => {
      console.warn("Mock redirectToLogin called", { fromUrl });
    },
  };

  const integrations = {
    Core: {
      UploadFile: ({ file }) =>
        new Promise((resolve) => {
          const url = typeof URL !== "undefined" && file ? URL.createObjectURL(file) : "";
          resolve({ file_url: url || "https://placehold.co/256x256?text=Avatar" });
        }),
      InvokeLLM: async ({ prompt, response_json_schema }) => {
        // Not used directly in the frontend mock path. Provide a deterministic stub.
        return { prompt, response_json_schema };
      },
      SendEmail: async () => ({ success: true }),
    },
  };

  const appLogs = {
    logUserInApp: async () => ({ success: true }),
  };

  const functions = {
    invoke: async (name, payload = {}) => {
      const db = loadMockDb();
      const users = db.entities.User || [];

      switch (name) {
        case "generateTaskDescription": {
          const objective = payload.objective || "";
          return ok({
            description: objective
              ? `Objective: ${objective}\n\nDraft plan:\n- Define scope and stakeholders\n- Create deliverables list\n- Execute and review\n- Publish final output`
              : "Draft description",
            subtasks: [],
          });
        }

        case "suggestTeamMembers": {
          const activeUsers = users.filter((u) => u.role !== "viewer");
          const suggestions = activeUsers.slice(0, 3).map((u, idx) => ({
            userId: u.id,
            name: u.full_name,
            reason: idx === 0 ? "Best availability based on current workload" : "Relevant department and role fit",
          }));
          return ok({ suggestions });
        }

        case "categorizeTasks": {
          const title = String(payload.taskTitle || "").toLowerCase();
          const tags = [];
          if (title.includes("mou")) tags.push("mou");
          if (title.includes("protocol")) tags.push("protocol");
          if (title.includes("data")) tags.push("data");
          if (tags.length === 0) tags.push("general");
          return ok({
            suggestedPriority: payload.priority || "medium",
            suggestedStatus: "not_started",
            tags,
            category: tags[0],
          });
        }

        case "prioritizeTask": {
          const due = payload.dueDate ? new Date(payload.dueDate) : null;
          const days = due ? Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24)) : null;
          const suggestedPriority =
            days !== null && days <= 3 ? "urgent" : payload.currentPriority || payload.priority || "medium";
          return ok({
            suggestedPriority,
            reasoning: "Mock prioritization based on due date proximity.",
            confidence: "medium",
          });
        }

        case "updateUserRole": {
          const { userId, newRole } = payload || {};
          if (!userId || !newRole) {
            const err = new Error("Missing userId or newRole");
            err.status = 400;
            throw err;
          }
          const idx = db.entities.User.findIndex((u) => u.id === userId);
          if (idx === -1) {
            const err = new Error("User not found");
            err.status = 404;
            throw err;
          }
          db.entities.User[idx] = { ...db.entities.User[idx], role: newRole, updated_date: new Date().toISOString() };
          saveMockDb(db);
          return ok({ success: true });
        }

        case "suggestTaskAssignment": {
          const initiatives = db.entities.Initiative || [];
          const openCounts = {};
          for (const t of initiatives) {
            if (!t.lead_user_id) continue;
            if (t.status === "completed") continue;
            openCounts[t.lead_user_id] = (openCounts[t.lead_user_id] || 0) + 1;
          }

          const taskData = payload.taskData || {};
          const candidates = users.filter((u) => u.role !== "viewer");
          const suggestions = candidates
            .map((u) => {
              const score = scoreUserForTask(u, taskData, openCounts[u.id] || 0);
              return { userId: u.id, userName: u.full_name, score, reasoning: "Mock fit based on workload and role." };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          const userProfiles = candidates.map((u) => ({
            id: u.id,
            name: u.full_name,
            email: u.email,
            department: u.department,
            position: u.position,
            taskCount: openCounts[u.id] || 0,
            completedCount: 0,
            completionRate: 0,
            avgProgressPercent: 0,
          }));

          return ok({ suggestions, userProfiles });
        }

        case "assignTaskToUser": {
          const { taskId, userId, initiativeData } = payload || {};
          if (!taskId || !userId) {
            const err = new Error("Missing taskId or userId");
            err.status = 400;
            throw err;
          }
          const taskIdx = db.entities.Initiative.findIndex((t) => t.id === taskId);
          if (taskIdx === -1) {
            const err = new Error("Task not found");
            err.status = 404;
            throw err;
          }

          const updated = ensureUserNameFields(
            {
              ...db.entities.Initiative[taskIdx],
              lead_user_id: userId,
              last_activity_at: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            },
            users
          );
          db.entities.Initiative[taskIdx] = updated;

          // Notification
          db.entities.Notification = db.entities.Notification || [];
          db.entities.Notification.push({
            id: `notif_${Date.now()}`,
            user_id: userId,
            type: "assignment",
            title: `New Task Assignment: ${initiativeData?.pillar || updated.pillar}`,
            message: `You have been assigned to lead "${initiativeData?.pillar || updated.pillar}".`,
            entity_type: "task",
            entity_id: taskId,
            is_read: false,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });

          saveMockDb(db);
          return ok({ success: true, updatedInitiative: updated, message: "Assigned (mock)" });
        }

        case "submitForApproval": {
          const { task_id } = payload || {};
          if (!task_id) {
            const err = new Error("Missing task_id");
            err.status = 400;
            throw err;
          }
          const task = (db.entities.Initiative || []).find((t) => t.id === task_id);
          if (!task) {
            const err = new Error("Task not found");
            err.status = 404;
            throw err;
          }
          const approvers = task.approval_required_from || [];
          if (!task.requires_approval || approvers.length === 0) {
            const err = new Error("Task does not require approval");
            err.status = 400;
            throw err;
          }

          db.entities.TaskApproval = db.entities.TaskApproval || [];
          db.entities.Notification = db.entities.Notification || [];

          const approvals = approvers.map((approverId, i) => {
            const approver = users.find((u) => u.id === approverId);
            const approval = {
              id: `ta_${Date.now()}_${i}`,
              task_id,
              approver_user_id: approverId,
              approver_name: approver?.full_name || "Unknown",
              status: "pending",
              sequence_order: i,
              is_sequential: true,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            };
            db.entities.Notification.push({
              id: `notif_${Date.now()}_${i}`,
              user_id: approverId,
              type: "approval_required",
              title: "Task Approval Required",
              message: `Approval needed for: ${task.pillar}`,
              entity_type: "task",
              entity_id: task_id,
              is_read: false,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            });
            return approval;
          });
          db.entities.TaskApproval.push(...approvals);

          const idx = db.entities.Initiative.findIndex((t) => t.id === task_id);
          db.entities.Initiative[idx] = { ...db.entities.Initiative[idx], approval_status: "submitted", updated_date: new Date().toISOString() };

          saveMockDb(db);
          return ok({ success: true, approvals, message: "Task submitted for approval (mock)" });
        }

        case "getLeaderboardData": {
          const initiatives = (db.entities.Initiative || []).map((t) => ensureUserNameFields(t, users));
          const teamMembers = db.entities.Teams || [];
          return ok(computeLeaderboard({ initiatives, teamMembers, ...payload }));
        }

        case "analyzeTeamPerformance": {
          const initiatives = payload.initiatives || [];
          const overdue = initiatives.filter((i) => i.status === "delayed").length;
          const completed = initiatives.filter((i) => i.status === "completed").length;
          const insights = [
            { title: "Completion overview", description: `${completed} completed out of ${initiatives.length}.`, severity: "info" },
          ];
          const recommendations = [
            { title: "Focus on overdue items", description: overdue ? "Rebalance workload to reduce delayed tasks." : "Keep current cadence.", impact: overdue ? "high" : "low" },
          ];
          const alerts = overdue
            ? [{ title: "Overdue tasks detected", description: `${overdue} tasks are marked delayed.`, severity: "warning", action: "Review owners and due dates." }]
            : [];
          return ok({ insights, recommendations, alerts });
        }

        case "importOutlookContacts": {
          // In Base44 this parses vCard; in local mock just return empty.
          return ok({ success: true, imported: [], errors: ["Mock mode: Outlook import not connected"], count: 0 });
        }

        case "importOutlookContactsOAuth": {
          return ok({ success: true, imported: [], errors: ["Mock mode: Outlook OAuth not connected"], count: 0 });
        }

        default: {
          const err = new Error(`Mock function not implemented: ${name}`);
          err.status = 501;
          throw err;
        }
      }
    },
  };

  return {
    __isMock: true,
    auth,
    entities,
    functions,
    integrations,
    appLogs,
    // Minimal compatibility surface used by Base44 server-side code paths.
    asServiceRole: { auth, entities },
  };
}

