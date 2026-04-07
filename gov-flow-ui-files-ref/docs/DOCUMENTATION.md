# Gov-Flow: Full Project Documentation

**Tourism Development Workflow System** — Government/company email–task management, assignment, and reporting.

**Product direction:** The system is intended to be **owned by your company** and **sold to other governments** (e.g. UAE). It must be **installable on client systems** and **white-labeled** (their name, logo, colors). For full product vision, white-label/installable design, who-starts-what flows, and what to implement from Base44 vs your own backend, see **[PRODUCT_AND_FLOWS.md](./PRODUCT_AND_FLOWS.md)**.

---

## Table of Contents

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Roles & Permissions](#2-roles--permissions)
3. [Modules & Pages](#3-modules--pages)
4. [Data Model & Entities](#4-data-model--entities)
5. [User Actions & Functionality](#5-user-actions--functionality)
6. [User Stories](#6-user-stories)
7. [Backend Functions](#7-backend-functions)
8. [Email-to-Task Flow](#8-email-to-task-flow)
9. [Local Development & Mock Mode](#9-local-development--mock-mode)

---

## 1. Project Overview & Architecture

### 1.1 Purpose

- **Inbound emails** (government/company mailboxes) are ingested and stored as **EmailMessage** records.
- Emails are **triaged** (category, assignee), then **converted** into **tasks** (Initiatives) or **linked** to existing tasks.
- **Admins/department managers** assign tasks to team members; **team members** execute and update progress.
- **Workflow stages** (e.g. Pipeline → In Progress → Completed) and optional **approvals** support process control.
- **Reports** and **team performance** dashboards provide visibility.

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, TanStack Query |
| UI | Tailwind CSS, shadcn/ui (Radix), Lucide icons |
| Backend / Data | Base44 (BaaS): entities, auth, server functions |
| Server functions | Deno (in `functions/`), invoked via `base44.functions.invoke()` |

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                              │
│  - AuthContext, React Query, Router                               │
│  - Pages: Tasks, Kanban, Email Inbox, Calendar, Team, Reports,   │
│    Departments, Workflow Stages, Routing Rules, Settings, etc.  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ base44 client (REST / SDK)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Base44 Backend                                                  │
│  - Auth (me, logout, updateMe)                                   │
│  - Entities: User, Initiative, EmailMessage, Notification,       │
│    Department, WorkflowStage, Subtask, Comment, etc.            │
│  - Server functions: assignTaskToUser, suggestTaskAssignment,    │
│    generateTaskDescription, submitForApproval, etc.             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Entry Points

- **`index.html`** → loads `src/main.jsx`.
- **`main.jsx`** → mounts `<App />` with `index.css`.
- **`App.jsx`** → wraps app in `AuthProvider`, `QueryClientProvider`, `Router`; renders `AuthenticatedApp` (routes from `pages.config.js`) and `Toaster`.
- **`pages.config.js`** → defines `PAGES`, `Layout`, and `mainPage` (default: **Tasks**). All routes are `/:pageKey` (e.g. `/Tasks`, `/EmailInbox`).
- **`Layout.jsx`** → sidebar nav (role-based), header (search, dark mode, notifications), and `children` (page content). Uses `base44.auth.me()` and RBAC for visibility.

---

## 2. Roles & Permissions

### 2.1 Role Definitions

| Role | Value | Description |
|------|--------|-------------|
| **Admin** | `admin` | Full access: all pages, departments, workflow, routing rules, team performance, user profile editing. |
| **Department Admin** | `department_admin` | Same as admin for department scope: tasks, team, reports, routing, departments, workflow stages, settings. Cannot manage global user list outside department context. |
| **Department Manager** | `department_manager` | Manage tasks and team; view reports, departments, routing (no edit), settings. No workflow stage or routing rule edit. |
| **Team Member** | `team_member` | View/create/edit own or assigned tasks; view team, reports, email, calendar; edit own profile; view settings. Limited Kanban drag (own tasks only). |
| **Editor** | `editor` | View and edit most content; routing and department edit; no full admin (e.g. no department delete). |
| **Viewer** | `viewer` | Read-only: tasks, team, reports, routing, profile, email, departments, settings. |
| **User** | `user` | Treated like viewer with create/edit own profile and tasks. |

### 2.2 Permissions (by capability)

- **Tasks:** `tasks:view`, `tasks:create`, `tasks:edit`, `tasks:delete`
- **Team:** `team:view`, `team:edit`, `team:manage_roles`
- **Reports:** `reports:view`, `reports:export`
- **Routing:** `routing:view`, `routing:edit`, `routing:delete`
- **Profile:** `profile:view_own`, `profile:edit_own`, `profile:edit_other`
- **Email:** `email:view`, `email:manage_rules`
- **Departments:** `departments:view`, `departments:edit`, `departments:delete`
- **Settings:** `settings:view`, `settings:admin`

### 2.3 Page Access (by role)

| Page | Allowed roles |
|------|----------------|
| Tasks, KanbanBoard, EmailInbox, CalendarView, Reports, Team, Profile | All defined roles |
| TeamPerformanceDashboard | admin, department_admin |
| DepartmentManagement | admin, department_admin |
| WorkflowStageManagement | admin, department_admin |
| RoutingRules | admin, department_admin, editor |
| Settings | All except none |

Layout hides nav items when the current “view role” (including role switcher for admins) has no access.

---

## 3. Modules & Pages

### 3.1 Tasks (`/Tasks`)

- **Purpose:** List and manage initiatives (tasks) with filters and views.
- **Data:** `Initiative.list('-created_date')`, `User.list()`.
- **Actions:** Create (navigate to TaskForm), edit (inline or link to TaskForm), delete (single + bulk), mark complete (bulk), export CSV. Filters: search, status, priority, lead, pillar, “email sourced”.
- **Views (tabs):** All, My Tasks, Overdue, Due This Week, In Progress, Completed, Blocked.

### 3.2 Task Form (`/TaskForm`)

- **Purpose:** Create or edit a single task; optionally pre-filled from an email (`?emailId=...`).
- **Data:** `Initiative` (by id if edit), `EmailMessage` (by emailId if create from email), `User.list()`.
- **Actions:** Save (create/update Initiative; if from email, update EmailMessage to converted + linked_task_id). AI: generate description, suggest team members, categorize, prioritize. Assignment suggestions (suggestTaskAssignment + assignTaskToUser).

### 3.3 Task Detail (`/TaskDetail`)

- **Purpose:** View one task with description, deliverables, progress, subtasks, comments, linked email, dependencies (if used), approval (if used).
- **Data:** Initiative by id, Subtasks, Comments, EmailMessage (if source_email_id), User.list().
- **Actions:** Edit (link to TaskForm), delete, add/update/delete subtasks, add comments.

### 3.4 Kanban Board (`/KanbanBoard`)

- **Purpose:** Drag-and-drop tasks by workflow stage.
- **Data:** `Initiative.list()`, `WorkflowStage.filter({ is_active: true }, 'order')`, `User.list()`.
- **Actions:** Drag task to column → update `workflow_stage_id`; move from backlog into a stage. Role-based: only admins/managers can drag any task; team members only their own. “Configure Board” links to WorkflowStageManagement.

### 3.5 Email Inbox (`/EmailInbox`)

- **Purpose:** Triage and convert emails; link to tasks.
- **Data:** `EmailMessage.filter({ mailbox }, '-received_at', 100)`, `User.list()`, `Initiative.list()` (for linking).
- **Actions:** Select mailbox (MailboxSelector), open email (mark read), star, categorize, assign to user, convert to task (→ TaskForm?emailId=), link to existing task, archive. Tabs: All, New, Starred, Converted, Archived.

### 3.6 Calendar (`/CalendarView`)

- **Purpose:** View tasks by due date (month/week/day).
- **Data:** `Initiative.list('-due_date')`, `User.list()`.
- **Actions:** Switch month/week/day; filter by assignee/status; click date to see list; “Add Task” opens QuickTaskDialog (creates Initiative with that date).

### 3.7 Team (`/Team`)

- **Purpose:** List team members by department with task stats.
- **Data:** `User.list()`, `Initiative.list()`.
- **Actions:** Search; view stats (tasks, done, active, overdue, avg completion); “View Tasks” (Tasks?lead=userId). Invite/import (InviteTeamMemberDialog, ImportContactsDialog).

### 3.8 Reports (`/Reports`)

- **Purpose:** Analytics over tasks and emails.
- **Data:** Initiative, User, EmailMessage; filtered by date range and lead.
- **Actions:** Change date range/lead; view metrics and charts; export JSON report.

### 3.9 Team Performance Dashboard (`/TeamPerformanceDashboard`)

- **Purpose:** Admin/department-admin analytics (completion, overdue, due soon, status/priority charts, member contribution).
- **Data:** Initiative, User, Department; filters: department, date range.
- **Access:** Rendered only if user role is admin; otherwise “no permission” message.

### 3.10 Department Management (`/DepartmentManagement`)

- **Purpose:** CRUD departments; manage department members.
- **Data:** `Department.list()`.
- **Actions:** Create/edit/delete department (DepartmentForm, DepartmentList); add/remove members (DepartmentMembers → User.department_id).
- **Access:** Admin only (enforced in page).

### 3.11 Workflow Stage Management (`/WorkflowStageManagement`)

- **Purpose:** Create/edit/delete/reorder workflow stages for Kanban.
- **Data:** `WorkflowStage.list('-order')`.
- **Actions:** Create, edit, delete, move up/down (swap order).

### 3.12 Routing Rules (`/RoutingRules`)

- **Purpose:** Define rules to auto-categorize/assign incoming emails (condition + action).
- **Data:** `RoutingRule.list('order')`, `User.list()`.
- **Actions:** Create, edit, delete, toggle active. Conditions: subject/from/body/domain; actions: assign to user, set category, add tag, set priority.

### 3.13 Settings (`/Settings`)

- **Purpose:** User preferences (notifications, email integration info, general).
- **Data:** `base44.auth.me()`.
- **Actions:** Save notification preferences via `base44.auth.updateMe({ notification_preferences })`.

### 3.14 Profile (`/Profile`)

- **Purpose:** View/edit current user (or, for admin, another user).
- **Data:** `base44.auth.me()`, optionally `User.list()` for admin.
- **Actions:** Update name, phone, department, position; upload avatar (Core.UploadFile + updateMe). Admin can select user to edit.

### 3.15 Notification Preferences (`/NotificationPreferences`)

- **Purpose:** Fine-grained toggles for in-app and email notifications (task assigned, profile updated, routing changes, due soon, overdue, etc.) and digest frequency.
- **Data:** `NotificationPreference` (filter by user_id).
- **Actions:** Create/update NotificationPreference record.

### 3.16 Notification Center (Layout)

- **Purpose:** Panel of recent notifications; mark read, delete.
- **Data:** `Notification.filter({ user_id }, '-created_date', 50)`.
- **Actions:** Mark one/all read; delete.

---

## 4. Data Model & Entities

### 4.1 Core Entities

| Entity | Key fields | Usage |
|--------|------------|--------|
| **User** | id, full_name, email, role, department, department_id, position, avatar_url, mailboxes, notification_preferences | Auth, assignees, team list, profile. |
| **Initiative** | id, pillar, brief_description, deliverables, lead_user_id, support_users, status, completion_percent, priority, start_date, due_date, workflow_stage_id, source_email_id, tags, stakeholders, requires_approval, approval_required_from, approval_status, is_recurring, recurrence_pattern, parent_task_id, created_date, updated_date | Tasks/initiatives. |
| **EmailMessage** | id, mailbox, subject, from_name, from_email, to_emails, body_*, received_at, status_in_system, category, linked_task_id, assigned_to_user_id, is_read, is_starred | Inbox and conversion. |
| **Notification** | id, user_id, type, title, message, entity_type, entity_id, is_read, created_date | In-app notifications. |
| **NotificationPreference** | user_id, notify_*, email_digest_frequency | Controls server-side notification behavior. |
| **Department** | id, name, sector, description, manager_user_id, is_active, member_count, ... | Org structure; User.department_id. |
| **WorkflowStage** | id, name, description, order, color, is_active, require_approval | Kanban columns. |
| **Subtask** | id, task_id, title, status, order, checklist_items, owner_user_id | Task breakdown. |
| **Comment** | id, entity_type, entity_id, comment_text, activity_type, is_system, created_by, created_date | Comments and activity log. |
| **TaskDependency** | id, dependent_task_id, prerequisite_task_id, dependency_type, is_active | Task dependencies. |
| **TaskApproval** | id, task_id, approver_user_id, status, sequence_order | Approval workflow. |
| **RoutingRule** | id, name, condition_type, condition_value, action_type, action_value, order, is_active | Email automation. |

### 4.2 Status & Enums

- **Task status:** not_started, in_progress, completed, on_hold, delayed.
- **Email status_in_system:** new, triaged, converted, archived.
- **Priority:** low, medium, high, urgent.
- **Dependency types:** finish_to_start, finish_to_finish, start_to_start, start_to_finish.

---

## 5. User Actions & Functionality

### 5.1 Task Lifecycle

1. **Create:** TaskForm (manual or “Convert to task” from email). Initiative.create(); if from email, EmailMessage.update(..., status_in_system: 'converted', linked_task_id).
2. **Read:** Tasks list, TaskDetail, Kanban, Calendar, Reports (all read Initiative + related entities).
3. **Update:** TaskForm (full edit); Tasks (inline status/quick actions); Kanban (workflow_stage_id); TaskDetail (subtasks, comments). Initiative.update(id, data).
4. **Delete:** Tasks (single/bulk), TaskDetail. Initiative.delete(id).
5. **Assign:** TaskForm (lead_user_id, support_users); or AssignmentSuggestions → assignTaskToUser (server function updates Initiative + creates Notification + optional email).

### 5.2 Email Triaging

- **View:** EmailInbox lists EmailMessage; open → mark read (EmailMessage.update(..., is_read: true)).
- **Categorize:** Set category; status_in_system → triaged.
- **Assign:** Set assigned_to_user_id; status_in_system → triaged.
- **Convert to task:** Navigate to TaskForm?emailId=…; on create, link email to new task.
- **Link to task:** Choose existing task; EmailMessage.update(..., linked_task_id, status_in_system: 'converted').
- **Archive:** status_in_system → archived.
- **Star:** Toggle is_starred.

### 5.3 Subtasks & Comments

- **Subtask:** Subtask.create/update/delete (task_id, title, status, order, checklist_items).
- **Comment:** Comment.create(entity_type, entity_id, comment_text, activity_type, is_system). UI separates comments vs system activity.

### 5.4 Dependencies & Approvals

- **Dependencies:** TaskDependency create/delete (dependent_task_id, prerequisite_task_id, dependency_type). validateTaskDependencies (server) can check if status change is allowed.
- **Approvals:** Task has approval_required_from[]; submitForApproval (server) creates TaskApproval records and notifications; UI shows status in ApprovalFlowManager.

### 5.5 Notifications

- **In-app:** Notification.create (by server functions or assignTaskToUser); user sees in NotificationCenter; mark read / delete (Notification.update/delete).
- **Preferences:** NotificationPreference create/update controls whether user gets in-app/email for assignment, profile update, routing change, due_soon, overdue, etc.

### 5.6 Departments & Team

- **Departments:** Department.create/update/delete; DepartmentMembers: User.update(userId, department_id).
- **Team:** User.list() + Initiative for stats; invite/import use server functions (importOutlookContacts, importOutlookContactsOAuth) and/or invite flow.

### 5.7 Workflow & Routing

- **Workflow:** WorkflowStage CRUD + reorder (swap order); Kanban uses workflow_stage_id on Initiative.
- **Routing:** RoutingRule CRUD; rules applied by backend when emails are ingested (logic in Base44/backend, not in this repo).

---

## 6. User Stories

### 6.1 Admin

- As an **admin**, I want to **see all tasks and emails** so that I can oversee operations.
- As an **admin**, I want to **create and assign tasks** (including from emails) so that work is allocated correctly.
- As an **admin**, I want to **manage departments and workflow stages** so that the org and Kanban reflect our process.
- As an **admin**, I want to **define routing rules** so that incoming emails are auto-categorized and assigned.
- As an **admin**, I want to **view team performance and reports** so that I can measure productivity and bottlenecks.
- As an **admin**, I want to **edit any user’s profile** so that roles and contact info stay up to date.
- As an **admin**, I want to **switch my view to department admin/manager/member** so that I can see the app as they do.

### 6.2 Department Admin / Manager

- As a **department admin/manager**, I want to **see my department’s tasks and team** so that I can coordinate work.
- As a **department admin/manager**, I want to **create tasks and assign them to team members** so that workload is balanced.
- As a **department admin/manager**, I want to **triage emails and convert them to tasks** so that nothing is lost.
- As a **department admin/manager**, I want to **move tasks on the Kanban board** so that status is visible to everyone.
- As a **department admin/manager**, I want to **view reports and completion trends** so that I can report up and adjust priorities.

### 6.3 Team Member

- As a **team member**, I want to **see my assigned tasks** (Tasks, Kanban, Calendar) so that I know what to do.
- As a **team member**, I want to **update task status and progress** so that my manager sees progress.
- As a **team member**, I want to **add subtasks and comments** so that we can collaborate on a task.
- As a **team member**, I want to **receive notifications when assigned** so that I don’t miss new work.
- As a **team member**, I want to **view the team and my profile** so that I can update my details and see who does what.

### 6.4 Email & Triaging

- As a **user with email access**, I want to **see new emails in one inbox** so that I can triage them quickly.
- As a **user**, I want to **convert an email to a new task** so that it becomes trackable.
- As a **user**, I want to **link an email to an existing task** so that correspondence is attached.
- As a **user**, I want to **categorize and assign emails** so that routing and ownership are clear before conversion.

### 6.5 Reporting & Visibility

- As a **manager**, I want to **filter reports by department and date** so that I can answer leadership questions.
- As an **admin**, I want to **export report data** so that I can use it in external tools.
- As a **user**, I want to **see overdue and due-soon tasks** so that I can prioritize.

---

## 7. Backend Functions

All run in Base44 (Deno) and are invoked via `base44.functions.invoke(name, payload)`.

| Function | Purpose | Typical payload | Returns / side effects |
|----------|---------|------------------|------------------------|
| **generateTaskDescription** | AI: expand title into description + subtasks | `{ objective }` | `{ description, subtasks[] }` |
| **suggestTeamMembers** | AI: suggest assignees by workload/description | `{ taskTitle, taskDescription }` | `{ suggestions[] }` (userId, name, reason) |
| **categorizeTasks** | AI: suggest priority, tags, category | `{ taskTitle, taskDescription, priority }` | `{ suggestedPriority, tags, category }` |
| **prioritizeTask** | AI: suggest priority from context | `{ taskTitle, taskDescription, dueDate, ... }` | `{ suggestedPriority, reasoning, confidence }` |
| **suggestTaskAssignment** | AI: rank users for assignment | `{ taskId, taskData }` | `{ suggestions[] }` (userId, userName, score, reasoning) |
| **assignTaskToUser** | Set lead; create notification; send email | `{ taskId, userId, initiativeData }` | `{ updatedInitiative }`; updates Initiative, creates Notification, optional SendEmail |
| **submitForApproval** | Create TaskApproval records; notify approvers | `{ task_id }` | `{ success, approvals[] }`; sets approval_status |
| **validateTaskDependencies** | Check if status change violates dependencies | `{ task_id, desired_status }` | `{ can_proceed, violations[] }` |
| **createRecurringTaskInstances** | Create next instance from recurring task | `{ task_id }` | `{ success, instance_id }` |
| **checkDueDateNotifications** | Create due_soon/overdue notifications (admin/scheduled) | — | `{ notifications_created }` |
| **importOutlookContacts** | Parse vCard; return contacts not yet users | `{ vCardText }` | `{ imported[], errors[] }` |
| **importOutlookContactsOAuth** | Fetch Outlook contacts via Graph API | `{}` | `{ imported[], errors[] }` |
| **notifyTaskAssignment** | (Trigger) On task update, notify assignee if preference on | event/data | — |
| **notifyProfileUpdate** | (Trigger) On user update by admin, notify user | event/data | — |
| **notifyRoutingRuleChange** | (Trigger) On RoutingRule create/update, notify admins/editors | event/data | — |

---

## 8. Email-to-Task Flow

1. **Ingestion:** Emails arrive in Base44 (configured mailbox/integration) and become **EmailMessage** records (status_in_system: new).
2. **Optional routing:** Backend applies **RoutingRule** conditions and sets category/assignee/priority.
3. **Inbox:** User opens Email Inbox; can filter by mailbox, view (All/New/Starred/Converted/Archived), search, category.
4. **Triage:** User can set category, assign to user (status → triaged), star, mark read.
5. **Convert:** “Convert to task” → TaskForm?emailId=…; form pre-fills from email; on save, new Initiative is created and EmailMessage updated (linked_task_id, status_in_system: converted).
6. **Link:** “Link to existing task” → choose task → EmailMessage.update(linked_task_id, status_in_system: converted).
7. **Archive:** EmailMessage.update(..., status_in_system: archived).

TaskDetail shows linked email when task has source_email_id; EmailViewer shows AI suggestions (suggested_category, suggested_assignee_id, suggested_priority) when present.

---

## 9. Local Development & Mock Mode

### 9.1 Running Locally

- **Prerequisites:** Node (LTS 20+), npm.
- **Env:** `.env` or `.env.local`: `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` (optional for mock), `VITE_USE_MOCK_BASE44=true` to force mock.
- **Commands:** `npm install`, `npm run dev` (Vite default: http://localhost:5173).

### 9.2 Mock Mode (no backend)

- When `VITE_BASE44_APP_BASE_URL` or `VITE_BASE44_APP_ID` is missing, or `VITE_USE_MOCK_BASE44=true`, the app uses an in-memory **mock Base44 client** (`src/api/base44Client.js`).
- **Auth:** No network call; `base44.auth.me()` returns first seed user. AuthContext skips public-settings call and uses mock me().
- **Entities:** Seed data for User, Initiative, EmailMessage, Department, WorkflowStage, etc.; full CRUD with optional **localStorage** persistence (keys `mock_users`, `mock_initiatives`, …).
- **Functions:** All `base44.functions.invoke(...)` return stub data; **assignTaskToUser** updates the mock Initiative store and creates a mock Notification.
- **Logging:** All mock calls log with `[mock-base44]` in the console for debugging.

### 9.3 Resetting Mock Data

- Clear localStorage keys `mock_*` in DevTools, or use “Clear site data” for localhost, then refresh to re-seed from initial arrays.

---

This document is the single source of truth for roles, modules, actions, functionality, user stories, and implementation details for the Gov-Flow project.
