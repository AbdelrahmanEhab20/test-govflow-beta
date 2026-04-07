# GovFlow Domain API Contract

This document describes the **domain API layer** used by the GovFlow UI (`src/api/*.js`). The UI calls only these functions; no page or component should call Base44 or HTTP directly. A future backend (Node/Mongo, Firebase, etc.) can implement this contract so the UI works by swapping the implementations in `src/api/`.

**Status:** Frozen for backend design. All core flows use this layer.

---

## authApi

| Function | Purpose |
|----------|---------|
| `getAppPublicSettings()` | App-level config (e.g. auth required). Returns `{ id, public_settings }`. |
| `getCurrentUser()` | Current authenticated user. |
| `updateMe(data)` | Update current user profile/settings. |
| `uploadAvatar(file)` | Upload profile photo and set `avatar_url` on user. |
| `logout(_options)` | Local sign-out; clears tokens and redirects to `/Tasks`. |
| `redirectToLogin()` | No-op in local mode; used when auth is required. |

---

## tasksApi

| Function | Purpose |
|----------|---------|
| `listTasks({ orderBy, limit })` | List tasks (Initiatives). Default `orderBy: '-created_date'`. |
| `getTaskById(id)` | Single task by id. |
| `updateTask(id, data)` | Update task. |
| `deleteTask(id)` | Delete task. |
| `createTask(data)` | Create task. |
| `listSubtasks(taskId)` | Subtasks for a task. |
| `createSubtask(data)` | Create subtask. |
| `updateSubtask(id, data)` | Update subtask. |
| `deleteSubtask(id)` | Delete subtask. |
| `listComments(entityType, entityId)` | Comments for an entity (e.g. task). |
| `createComment(data)` | Create comment. |
| `listTaskDependencies(taskId)` | Dependencies filtered by `task_id`. |
| `listTaskDependenciesByDependent(dependentTaskId)` | Dependencies where task is dependent (`dependent_task_id`, `is_active: true`). |
| `createTaskDependency(data)` | Create task dependency. |
| `deleteTaskDependency(id)` | Delete task dependency. |

---

## usersApi

| Function | Purpose |
|----------|---------|
| `listUsers()` | List all users. |
| `updateUser(userId, data)` | Update user (profile, role, department_id, etc.). |
| `updateUserRole(userId, newRole)` | Invoke role-update (e.g. function). |
| `inviteUser(email, role)` | Invite user by email with role. |

---

## emailApi

| Function | Purpose |
|----------|---------|
| `listEmails(query, orderBy, limit)` | List emails. Default `orderBy: '-received_at'`, `limit: 100`. |
| `getEmailById(id)` | Single email by id. |
| `updateEmail(id, data)` | Update email (status, category, linked_task_id, etc.). |

---

## departmentsApi

| Function | Purpose |
|----------|---------|
| `listDepartments()` | List departments. |
| `listTeams()` | List team members (Teams entity). |
| `createDepartment(data)` | Create department. |
| `updateDepartment(id, data)` | Update department. |
| `deleteDepartment(id)` | Delete department. |
| `updateTeam(memberId, data)` | Update team member (e.g. department_name). |

---

## workflowApi

| Function | Purpose |
|----------|---------|
| `listWorkflowStages(filters, orderBy)` | List workflow stages. Default `orderBy: 'order'`. |
| `createWorkflowStage(data)` | Create stage. |
| `updateWorkflowStage(id, data)` | Update stage. |
| `deleteWorkflowStage(id)` | Delete stage. |
| `bulkCreateWorkflowStages(items)` | Create multiple stages (e.g. demo Kanban). |

---

## notificationsApi

| Function | Purpose |
|----------|---------|
| `listNotificationsForUser(userId)` | Notifications for user. |
| `markNotificationRead(id)` | Set `is_read: true`. |
| `deleteNotification(id)` | Delete notification. |

---

## notificationPreferencesApi

| Function | Purpose |
|----------|---------|
| `getNotificationPreferencesForUser(userId)` | Single preference record or null. |
| `listNotificationPreferencesForUser(userId)` | All preference records for user. |
| `updateNotificationPreference(id, data)` | Update preference. |
| `createNotificationPreference(data)` | Create preference. |

---

## routingRulesApi

| Function | Purpose |
|----------|---------|
| `listRoutingRules(orderBy)` | List routing rules. Default `orderBy: 'order'`. |
| `createRoutingRule(data)` | Create rule. |
| `updateRoutingRule(id, data)` | Update rule. |
| `deleteRoutingRule(id)` | Delete rule. |

---

## rbacApi

| Function | Purpose |
|----------|---------|
| `listRolePageAccess(orderBy)` | Role–page access rules. |
| `updateRolePageAccess(id, data)` | Update rule. |
| `createRolePageAccess(data)` | Create rule. |
| `listRolePermissions()` | Role–permission rules. |
| `updateRolePermission(id, data)` | Update rule. |
| `createRolePermission(data)` | Create rule. |

---

## approvalsApi

| Function | Purpose |
|----------|---------|
| `listTaskApprovals(taskId)` | Approval records for a task. |
| `submitForApproval(taskId)` | Submit task for approval (invoke function). |

---

## analyticsApi

| Function | Purpose |
|----------|---------|
| `getLeaderboardData(params)` | Leaderboard data (e.g. startDate, endDate, sector, department). |
| `analyzeTeamPerformance(params)` | AI/analytics analysis (initiatives, teamMembers, departments, etc.). |

---

## Out of scope (still invoked via Base44 in UI)

These are not part of the frozen domain API; the UI still calls Base44 for them. They can be moved behind `src/api/functionsApi.js` or similar later:

- **TaskForm AI:** `generateTaskDescription`, `suggestTeamMembers`, `categorizeTasks`, `prioritizeTask`
- **AssignmentSuggestions:** `assignTaskToUser`, `suggestTaskAssignment`
- **ImportContactsDialog:** `importOutlookContacts`, `importOutlookContactsOAuth`
- **NavigationTracker:** `appLogs.logUserInApp(pageName)`

---

## Verification

- **No direct Base44 in pages/components:** All data and auth go through the above APIs. The only remaining direct Base44 usage is the function/integration calls listed in “Out of scope.”
- **Mock mode:** When `VITE_USE_MOCK` or missing Base44 config, `base44Client.js` uses `mockBase44Client`, which backs the same API surface with in-memory/localStorage data.
