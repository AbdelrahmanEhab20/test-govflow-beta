# Gov-Flow: Backend Functions Reference

Full reference for every server-side function in `functions/`. Use this when porting to Firebase Cloud Functions or debugging behavior.

**Runtime:** Deno (Base44). Each function is an HTTP handler: `Deno.serve(async (req) => { ... })`.  
**Auth:** Via `createClientFromRequest(req)` then `base44.auth.me()`.  
**Entities:** All data access through `base44.entities.*` or `base44.asServiceRole.entities.*`.

---

## Table of Contents

1. [assignTaskToUser](#1-assigntasktouser)
2. [submitForApproval](#2-submitforapproval)
3. [checkDueDateNotifications](#3-checkduedatenotifications)
4. [updateUserRole](#4-updateuserrole)
5. [getLeaderboardData](#5-getleaderboarddata)
6. [analyzeTeamPerformance](#6-analyzeteamperformance)
7. [suggestTaskAssignment](#7-suggesttaskassignment)
8. [generateTaskDescription](#8-generatetaskdescription)
9. [suggestTeamMembers](#9-suggestteammembers)
10. [categorizeTasks](#10-categorizetasks)
11. [prioritizeTask](#11-prioritizetask)
12. [createRecurringTaskInstances](#12-createrecurringtaskinstances)
13. [validateTaskDependencies](#13-validatetaskdependencies)
14. [importOutlookContacts](#14-importoutlookcontacts)
15. [importOutlookContactsOAuth](#15-importoutlookcontactsoauth)
16. [notifyRoutingRuleChange](#16-notifyroutingrulechange)
17. [notifyTaskAssignment](#17-notifytaskassignment)
18. [notifyProfileUpdate](#18-notifyprofileupdate)

---

## 1. assignTaskToUser

**File:** `functions/assignTaskToUser.ts`

**Purpose:** Assigns a task (Initiative) to a user as lead, creates an in-app notification, and sends an email to the assignee.

**Trigger:** HTTP POST (invoked by frontend via `base44.functions.invoke('assignTaskToUser', { taskId, userId, initiativeData })`).

**Auth:** Any authenticated user. No role check (frontend or rules should restrict who can assign).

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | Yes | Initiative ID |
| `userId` | string | Yes | User ID to assign as lead |
| `initiativeData` | object | No | Used for notification/email text: `pillar`, `priority`, `due_date`, `brief_description` |

**Response:** `{ success: true, updatedInitiative, message }` or `{ error: string }` with 4xx/5xx.

**Side effects:**
- **Initiative:** `Initiative.update(taskId, { lead_user_id: userId })`
- **Notification:** `Notification.create` for assignee, type `assignment`, title/message from initiativeData
- **Email:** `base44.integrations.Core.SendEmail` to assignee email (if present) with task summary

**Base44 entities/APIs used:** `Initiative.update`, `User.get`, `Notification.create`, `integrations.Core.SendEmail`

**Firebase port notes:** Cloud Function (callable or HTTPS). Update `tasks/{taskId}.assigneeId`, create `notifications` doc, call SendGrid/Mailgun or Firebase Extensions for email. Add audit log entry. Enforce role/department in function (admin or manager for that department).

---

## 2. submitForApproval

**File:** `functions/submitForApproval.ts`

**Purpose:** Submits a task for sequential approval: creates one TaskApproval record per approver, notifies each, and sets task `approval_status` to `submitted`.

**Trigger:** HTTP POST. Body: `{ task_id }`.

**Auth:** Not explicitly checked (relies on Base44 request auth). Caller should have `tasks:edit`.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | Yes | Initiative ID |

**Response:** `{ success: true, approvals[], message }` or 400 if task not found / does not require approval.

**Logic:**
- Load task; require `requires_approval === true` and non-empty `approval_required_from` (array of user IDs).
- For each approver in order: create `TaskApproval` with `task_id`, `approver_user_id`, `approver_name`, `status: 'pending'`, `sequence_order`, `is_sequential: true`.
- Create `Notification` for each approver, type `approval_required`, title "Task Approval Required".
- Update `Initiative.update(task_id, { approval_status: 'submitted' })`.

**Side effects:** Initiative (1 update), TaskApproval (N creates), Notification (N creates).

**Firebase port notes:** Callable Cloud Function. Create `taskApprovals` docs, `notifications` docs, update `tasks/{taskId}.approvalStatus`. Optionally send email to approvers. Audit log.

---

## 3. checkDueDateNotifications

**File:** `functions/checkDueDateNotifications.ts`

**Purpose:** Scheduled job. Finds active (non-completed) tasks with due dates and creates **overdue** or **due_soon** notifications for assignees if not already sent.

**Trigger:** HTTP POST. Intended to be called by a scheduler (e.g. daily 8:00 AM).

**Auth:** **Admin only.** `user?.role !== 'admin'` → 403.

**Request body:** None required (can be empty JSON).

**Response:** `{ success: true, notifications_created, details }` where `details` is an array of `{ type, task, days? }`.

**Logic:**
- `Initiative.filter({ status: { $ne: 'completed' } })`.
- For each task with `due_date` and `lead_user_id`:
  - **Overdue:** `daysUntilDue < 0`. If no existing Notification with same `user_id`, `entity_id`, `type: 'overdue'`, create one (message: "Task X is N day(s) overdue").
  - **Due soon:** `0 <= daysUntilDue <= 2`. If no existing `due_soon` notification for that user/task, create one ("due today" or "in N day(s)").
- Deduplication: filter existing notifications by `user_id`, `entity_id`, `type` before creating.

**Side effects:** Notification creates only. No task updates.

**Firebase port notes:** **Scheduled Cloud Function** (Cloud Scheduler, daily 8:00 AM me-central1). Query `tasks` where `status != 'completed'`, `dueDate` set; compute overdue vs due-within-48h; write `notifications` with dedupe (e.g. by `(userId, taskId, type)`). No auth from request; use admin SDK. Consider `checkDueDateNotifications` as the function name.

---

## 4. updateUserRole

**File:** `functions/updateUserRole.ts`

**Purpose:** Updates a user’s role. Used by Access Control / Team page when an admin assigns a role.

**Trigger:** HTTP POST.

**Auth:** **Admin only.** `user.role !== 'admin'` → 403.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | User to update |
| `newRole` | string | Yes | New role (e.g. `admin`, `department_admin`, `team_member`) |

**Response:** `{ success: true }` or error.

**Side effects:** Calls `base44.asServiceRole.users.updateUser(userId, { role: newRole })`. In Base44 this likely updates both the user record and possibly auth metadata. **No Notification created here.**

**Firebase port notes:** **Critical for RBAC.** Cloud Function that:
1. Verifies caller is admin (custom claim `role === 'admin'`).
2. Updates Firestore `users/{userId}.role` (and optionally `departmentId`, `tenantId`).
3. Sets Firebase Auth **custom claims** for `userId`: `role`, `departmentId`, `tenantId` (via Admin SDK `setCustomUserClaims`).
4. Optionally create audit log entry. No notification in this function (profile update notification is separate — notifyProfileUpdate).

---

## 5. getLeaderboardData

**File:** `functions/getLeaderboardData.ts`

**Purpose:** Computes leaderboard metrics for team members, departments, and sectors (filtered by optional date/sector/department). Used by the Leaderboard page.

**Trigger:** HTTP POST.

**Auth:** Any authenticated user (no role check).

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string | No | Filter initiatives by due_date >= startDate |
| `endDate` | string | No | Filter initiatives by due_date <= endDate |
| `sector` | string | No | Filter by member’s sector_name |
| `department` | string | No | Filter by member’s department_name |

**Response:** `{ teamMembers, departments, sectors }` — each is an array of ranked objects with metrics (see below).

**Data sources:** `Initiative.list()`, `Teams.list()`. Note: code uses `Teams` for member info (name, department_name, sector_name, job_title); initiatives use `lead_user_name` to join. Non-archived initiatives are filtered by date and optional sector/department.

**Metrics computed:**
- **Team members:** per member: total tasks, completed, in_progress, delayed, completion_rate, avg_completion_percent, on_time_rate, **score** (formula: `(completed/total)*60 + completed*3 + avg_completion_percent*0.4`). Sorted by score descending.
- **Departments:** aggregated from member stats: name, sector, member_count, total/completed/in_progress/delayed, completion_rate, avg_member_rate, **score**.
- **Sectors:** aggregated from department stats: name, dept_count, member_count, totals, completion_rate, avg_dept_rate, **score**.

**Side effects:** Read-only. No writes.

**Firebase port notes:** Callable or HTTPS function. Query `tasks` (and `users` for department/sector if not on task). If using Firestore, ensure you have indexes for filters. Compute in-memory or use aggregation if scale demands. **Future feature** per MVP — can defer implementation.

---

## 6. analyzeTeamPerformance

**File:** `functions/analyzeTeamPerformance.ts`

**Purpose:** Admin-only. Takes initiatives, team members, departments, and optional sector/department filters; builds a text summary and calls an LLM to return **insights**, **recommendations**, and **alerts** in structured JSON.

**Trigger:** HTTP POST.

**Auth:** **Admin only.** `!user || user.role !== 'admin'` → 401.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `initiatives` | array | Yes | List of initiative objects (often passed from frontend after fetch) |
| `teamMembers` | array | No | Team/member list for department resolution |
| `departments` | array | No | |
| `selectedSector` | string | No | Label for prompt |
| `selectedDepartment` | string | No | Label for prompt |

**Response:** LLM response with schema:
- `insights`: `[{ title, description, severity: 'info'|'warning'|'success' }]`
- `recommendations`: `[{ title, description, department?, impact: 'high'|'medium'|'low' }]`
- `alerts`: `[{ title, description, severity: 'critical'|'warning'|'info', action }]`

**Side effects:** Reads initiatives/team/departments (or uses payload). Calls `base44.integrations.Core.InvokeLLM` with prompt and `response_json_schema`. No DB writes.

**Firebase port notes:** Callable, admin-only. Replace `InvokeLLM` with Vertex AI or another LLM API; keep same prompt shape and JSON schema. **Future feature** (Team Performance Dashboard).

---

## 7. suggestTaskAssignment

**File:** `functions/suggestTaskAssignment.ts`

**Purpose:** AI-powered assignment suggestion. Given a task (taskId + taskData), loads all users and initiatives, builds per-user metrics (task count, completion rate, avg progress), and asks an LLM for top 3 suggested assignees with scores and reasoning.

**Trigger:** HTTP POST.

**Auth:** Any authenticated user.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | Yes | Task ID (for context) |
| `taskData` | object | Yes | At least `pillar`, `brief_description`, `priority`, `status`, `due_date`, `deliverables` |

**Response:** `{ suggestions: [{ userId, userName, score, reasoning }], userProfiles }`. `userProfiles` is the computed list of user metrics (taskCount, completedCount, completionRate, avgProgressPercent).

**Side effects:** Reads User.list(), Initiative.list(). Calls `InvokeLLM` with structured prompt and schema. No writes.

**Firebase port notes:** Callable. Fetch users and tasks from Firestore; compute workload metrics; call Vertex AI (or OpenAI) with same prompt/schema. **Future (AI Wave 1).**

---

## 8. generateTaskDescription

**File:** `functions/generateTaskDescription.ts`

**Purpose:** Given a short objective/title, uses an LLM to generate a detailed task description and 3–5 subtasks (strings).

**Trigger:** HTTP POST.

**Auth:** Any authenticated user.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `objective` | string | Yes | High-level task title/objective |

**Response:** `{ description: string, subtasks: string[] }` (from LLM schema).

**Side effects:** Only `InvokeLLM`. No DB access.

**Firebase port notes:** Callable. Replace with Vertex AI / OpenAI; same prompt and schema. **Future (AI Wave 1).**

---

## 9. suggestTeamMembers

**File:** `functions/suggestTeamMembers.ts`

**Purpose:** Given task title and description, loads users and initiatives, computes per-user workload (open task count, avg completion %), and asks LLM for 2–3 suggested team members. Returns suggestions with `userId` matched by name.

**Trigger:** HTTP POST.

**Auth:** Any authenticated user.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskTitle` | string | Yes | |
| `taskDescription` | string | Yes | |

**Response:** `{ suggestions: [{ userId, name, reason }] }`. Schema from LLM uses `name`; code maps name to `userId` from `userWorkloads`.

**Side effects:** User.list(), Initiative.list(), InvokeLLM. No writes.

**Firebase port notes:** Same as suggestTaskAssignment — Firestore queries + LLM. **Future (AI).**

---

## 10. categorizeTasks

**File:** `functions/categorizeTasks.ts`

**Purpose:** LLM suggests priority, status, tags, and category for a task given title, description, and current priority.

**Trigger:** HTTP POST.

**Auth:** Any authenticated user.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskTitle` | string | Yes | |
| `taskDescription` | string | Yes | |
| `priority` | string | No | Current priority (in prompt) |

**Response:** `{ suggestedPriority, suggestedStatus, tags, category }` with enums as in schema (e.g. priority: low|medium|high|urgent; status: not_started|in_progress|on_hold).

**Side effects:** InvokeLLM only.

**Firebase port notes:** Callable + Vertex AI. **Future (AI).**

---

## 11. prioritizeTask

**File:** `functions/prioritizeTask.ts`

**Purpose:** LLM suggests a priority level from task title, description, due date, dependencies, current priority, assigned user count, and status. Returns suggestedPriority, reasoning, and confidence.

**Trigger:** HTTP POST.

**Auth:** Any authenticated user.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskTitle` | string | Yes | |
| `taskDescription` | string | Yes | |
| `dueDate` | string | No | |
| `dependencies` | string | No | |
| `currentPriority` | string | No | |
| `assignedUserCount` | string/number | No | |
| `status` | string | No | |

**Response:** `{ suggestedPriority, reasoning, confidence }` — confidence is `high`|`medium`|`low`.

**Side effects:** InvokeLLM only.

**Firebase port notes:** Callable + LLM. **Future (AI).**

---

## 12. createRecurringTaskInstances

**File:** `functions/createRecurringTaskInstances.ts`

**Purpose:** Scheduled job. Finds all recurring, non-archived initiatives; for each, checks if an instance was already created today (by `parent_task_id`); if not, computes next instance date from `recurrence_pattern` (daily|weekly|monthly|yearly) and `due_date` or `start_date`; respects `recurrence_end_date`; creates a new Initiative as a copy with new dates and `is_recurring: false`, `parent_task_id` set.

**Trigger:** HTTP POST (scheduler).

**Auth:** None checked (service-style call).

**Request body:** None.

**Response:** `{ success: true, message, created: number, instances: id[] }`.

**Logic:**
- `Initiative.filter({ is_recurring: true, is_archived: false })`.
- For each parent: get latest child by `parent_task_id`; if last created < 1 day ago, skip.
- `getNextDate(startDate, pattern)` using date-fns: daily → addDays(1), weekly → addWeeks(1), monthly → addMonths(1), yearly → addYears(1).
- If `recurrence_end_date` and next date > end, skip.
- Initiative.create with same pillar, description, lead, support, deliverables, priority, stakeholders, tags, workflow_stage_id; new start_date/due_date = nextInstanceDate; status not_started, completion_percent 0, is_recurring false, parent_task_id.

**Side effects:** Initiative creates only.

**Firebase port notes:** **Scheduled Cloud Function** (e.g. daily). Query `tasks` where `isRecurring === true` and `isArchived !== true`. For each, check last child in `tasks` by `parentTaskId`; compute next date; create new task document. Use Firestore server timestamp for created date. **MVP** if recurring tasks are in scope.

---

## 13. validateTaskDependencies

**File:** `functions/validateTaskDependencies.ts`

**Purpose:** Given a task and a desired status, loads all active dependencies where this task is the dependent; for each prerequisite task, checks dependency_type (finish_to_start, finish_to_finish, start_to_start, start_to_finish) and whether the desired status change is allowed. Returns whether the change can proceed and a list of violations.

**Trigger:** HTTP POST.

**Auth:** None checked (relies on caller).

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | Yes | Dependent task ID |
| `desired_status` | string | Yes | e.g. `in_progress`, `completed` |

**Response:** `{ can_proceed: boolean, violations: [{ prerequisite_id, prerequisite_title, reason, dependency_type }] }`.

**Dependency rules (summary):**
- **finish_to_start:** prerequisite must be completed; else violation.
- **finish_to_finish:** if desired_status is completed and prerequisite not completed → violation (both must finish together).
- **start_to_start:** prerequisite must be started (not not_started); else violation.
- **start_to_finish:** if desired_status is in_progress and prerequisite not completed → violation.

**Side effects:** Read-only (TaskDependency.filter, Initiative.get).

**Firebase port notes:** Callable. Query `taskDependencies` where `dependentTaskId === taskId` and `isActive === true`; for each, load prerequisite task and apply same rules. **MVP** if task dependencies are in scope.

---

## 14. importOutlookContacts

**File:** `functions/importOutlookContacts.ts`

**Purpose:** Admin-only. Accepts vCard text, parses it into contacts (name, email, phone, jobTitle, department, position), and for each contact with an email checks if a User with that email already exists; if not, adds to `imported` array (does **not** create User entities — admin invites separately). Returns list of importable contacts and any errors.

**Trigger:** HTTP POST.

**Auth:** **Admin only.** `user.role !== 'admin'` → 403.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vCardText` | string | Yes | Raw vCard (one or more BEGIN:VCARD...END:VCARD) |

**Response:** `{ success: true, imported: [{ email, name, department, position, phone }], errors: string[], count }`.

**Parsing:** Custom `parseVCard`: split by BEGIN:VCARD, parse FN, EMAIL, TEL, TITLE, ORG, X-DEPARTMENT; `extractValue` handles colons, quotes, escaped chars.

**Side effects:** User.filter (read) per contact. No User creates.

**Firebase port notes:** Callable, admin-only. Parse vCard (reuse or use a library). For each contact, query `users` by email; if none, add to returned `imported` list. Frontend or separate flow creates/invites users. **Future** (team import).

---

## 15. importOutlookContactsOAuth

**File:** `functions/importOutlookContactsOAuth.ts`

**Purpose:** Admin-only. Uses Base44 Outlook connector access token to call Microsoft Graph `GET /me/contacts`; for each contact with an email, checks if User exists; if not, adds to `imported` with displayName, jobTitle, mobilePhone/businessPhones, department. Same idea as vCard import but source is Graph API.

**Trigger:** HTTP POST.

**Auth:** **Admin only.** Also requires `base44.asServiceRole.connectors.getAccessToken('outlook')` — if missing, 401.

**Request body:** None required.

**Response:** `{ success: true, imported[], errors[], count }`.

**Side effects:** Graph API read; User.filter (read). No User creates.

**Firebase port notes:** Callable, admin-only. Store Outlook OAuth tokens (e.g. in Firestore or Secret Manager); call Graph API; same “existing user” check and return structure. **Future (Wave 2 — M365 mail).**

---

## 16. notifyRoutingRuleChange

**File:** `functions/notifyRoutingRuleChange.ts`

**Purpose:** **Event-style handler.** Expects `{ event, data }` — on RoutingRule create or update, notifies all users with role admin or editor who have `NotificationPreference.notify_routing_rule_changes === true`. Creates a Notification (type status_change, title "Routing Rule Created/Modified", message includes rule name).

**Trigger:** HTTP POST with body `{ event: { type: 'create'|'update' }, data: rule }`.

**Auth:** Not validated (assumed called by backend/trigger).

**Side effects:** User.list(), filter admin/editor; for each, NotificationPreference.filter by user_id; if notify_routing_rule_changes, Notification.create.

**Firebase port notes:** **Firestore trigger** on `routingRules/{id}` onCreate/onUpdate. In function, query users where role in [admin, editor]; for each, check notification preferences doc; if enabled, write to `notifications`. **MVP** if routing rules are used.

---

## 17. notifyTaskAssignment

**File:** `functions/notifyTaskAssignment.ts`

**Purpose:** **Event-style handler.** On task (Initiative) update, if task has lead_user_id or lead_user_name, resolves assignee user; checks NotificationPreference for notify_task_assigned and notify_task_assigned_email; creates in-app Notification and/or sends email via SendEmail.

**Trigger:** HTTP POST with body `{ event: { type: 'update' }, data: task }`. Typically invoked when a task’s assignee is set (e.g. after assignTaskToUser or direct update).

**Auth:** Not validated (trigger).

**Side effects:** User.get/list to resolve assignee; NotificationPreference.filter; Notification.create if in-app enabled; SendEmail if email enabled.

**Firebase port notes:** Can be **Firestore trigger** on `tasks/{id}` onUpdate: if `assigneeId` changed, load assignee and preferences; create notification doc; optionally send email. Alternatively keep assignment notification inside `assignTaskToUser` and skip this trigger for MVP. **MVP** (notifications).

---

## 18. notifyProfileUpdate

**File:** `functions/notifyProfileUpdate.ts`

**Purpose:** **Event-style handler.** On user update, if the updater is an admin (and not self), and the updated user has NotificationPreference.notify_profile_updated, creates a Notification listing what changed (name, phone, department, position, role).

**Trigger:** HTTP POST with body `{ event: { type: 'update' }, data: user, old_data: user }`.

**Auth:** Uses base44.auth.me() to ensure current user is admin and not the same as updated user.

**Side effects:** NotificationPreference.filter; Notification.create.

**Firebase port notes:** **Firestore trigger** on `users/{id}` onUpdate. Compare old vs new; if caller is admin (from context) and target has preference, write notification. **MVP** (profile/settings).

---

## Summary: MVP vs Future

| Function | MVP | Notes |
|----------|-----|--------|
| assignTaskToUser | Yes | Core assignment + notification + email |
| submitForApproval | Yes | Sequential approvals |
| checkDueDateNotifications | Yes | Scheduled daily |
| updateUserRole | Yes | Auth claims + Firestore |
| getLeaderboardData | Future | Leaderboard page |
| analyzeTeamPerformance | Future | AI dashboard |
| suggestTaskAssignment | Future | AI |
| generateTaskDescription | Future | AI |
| suggestTeamMembers | Future | AI |
| categorizeTasks | Future | AI |
| prioritizeTask | Future | AI |
| createRecurringTaskInstances | Yes | If recurring in MVP |
| validateTaskDependencies | Yes | If dependencies in MVP |
| importOutlookContacts | Future | Team import |
| importOutlookContactsOAuth | Future | M365 Wave 2 |
| notifyRoutingRuleChange | Yes | Trigger on routing rules |
| notifyTaskAssignment | Yes | Or fold into assignTaskToUser |
| notifyProfileUpdate | Yes | Trigger on user update |

---

*Last updated: February 2026. Align with [DOCUMENTATION.md](./DOCUMENTATION.md) and [PRODUCT_AND_FLOWS.md](./PRODUCT_AND_FLOWS.md) for product context.*
