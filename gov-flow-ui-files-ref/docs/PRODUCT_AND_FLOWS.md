# Gov-Flow: Product Vision, White-Label & Installable Design, and System Flows

This document covers:

1. **Product vision** — Own the solution, sell to other governments (e.g. UAE), installable on their systems, white-labeled.
2. **White-label & installable architecture** — How to make the system tenant-aware and rebrandable per client.
3. **Complete system flows** — Who starts each flow, who has what rights, and step-by-step so the system is 100% understandable.
4. **What comes from Base44 vs what you build** — Clear split for migration/rebuild.

---

## 1. Product Vision

### 1.1 Goal

- **Your company owns** the Gov-Flow product (code, IP, roadmap).
- **Sell to other governments**, especially in the UAE and region.
- **Each client** can:
  - **Install the system in their own environment** (their cloud, their data center, or your managed hosting).
  - **Use it as their own** — **white-labeled**: their name, logo, colors, domain, and (optionally) terminology.

### 1.2 Implications

| Requirement | Implication |
|-------------|-------------|
| **Own the solution** | No dependency on Base44 long-term; replace auth, data, and functions with your stack (e.g. Firebase / your backend). |
| **Sell to other govs** | Multi-tenant or multi-install: each government is a separate “tenant” or “installation” with isolated data. |
| **Install in their systems** | Deployable as **on-prem / private cloud** (Docker, installer, or cloud project per client) — not only public SaaS. |
| **White-labeled** | **Config-driven branding**: app name, logo, favicon, primary/secondary colors, footer text, support URL — no hardcoded “Gov-Flow” or “Tourism Development” in client-facing strings. |

---

## 2. White-Label & Installable Architecture

### 2.1 What Must Be Configurable (White-Label)

Every client-facing string and asset should come from **tenant/installation config**, not hardcoded:

| Item | Example | Where used |
|------|--------|------------|
| **App name** | "Tourism Development Workflow" / "UAE Ministry Workflow" | Sidebar title, browser tab, login screen |
| **Logo** | URL or asset | Sidebar, header, login |
| **Favicon** | URL or asset | Browser tab |
| **Primary color** | e.g. `#1e40af` | Buttons, links, active states, accents |
| **Secondary color** | e.g. `#4f46e5` | Gradients, secondary buttons |
| **Support / legal** | "Support", "Privacy", "Terms" URLs or text | Footer, Settings |
| **Locale / language** | `en` / `ar` | Labels, dates, RTL (important for UAE) |

**Recommendation:** Single **tenant config** object (per install or per tenant), e.g.:

```json
{
  "tenantId": "uae-ministry-xyz",
  "appName": "UAE Tourism Development Workflow",
  "logoUrl": "https://...",
  "faviconUrl": "https://...",
  "primaryColor": "#1e40af",
  "secondaryColor": "#4f46e5",
  "supportUrl": "https://...",
  "locale": "ar",
  "features": { "emailInbox": true, "approvals": true }
}
```

- **Option A — Per-install:** Config comes from env at build time (`VITE_APP_NAME`, etc.) or from a static `config.json` in `public/` loaded at runtime.
- **Option B — Multi-tenant SaaS:** Config loaded at runtime by subdomain or login (e.g. `GET /api/tenant/config` or Firestore `tenants/{tenantId}`).

### 2.2 Installation Models

| Model | Description | Data isolation | Best for |
|-------|-------------|----------------|----------|
| **Single install per client** | One deployment per government (their server or your dedicated project). | Separate DB and app instance per client. | Maximum control, air-gapped or strict data residency. |
| **Multi-tenant SaaS** | One app, many tenants; tenant chosen by subdomain or after login. | `tenantId` (or `installationId`) on every document; all queries filtered by tenant. | Lower ops cost, many small/medium clients. |

For **UAE and other govs**, offering **both** is ideal:

- **Option 1:** Dedicated install (Docker/installer or dedicated Firebase project) — their branding, their infra.
- **Option 2:** Your cloud, multi-tenant — same code, tenant config + `tenantId` in data.

### 2.3 Data Isolation

- **Per-install:** No `tenantId` needed; each install has its own database (e.g. own Firestore project).
- **Multi-tenant:** Every collection must have **tenantId** (or equivalent); all reads/writes and security rules scope by `tenantId`. Auth: either separate Firebase project per tenant or one project with custom claims `tenantId` + Firestore rules.

### 2.4 Codebase Changes (High Level)

- **Centralize branding:** Replace hardcoded "Tourism Development", "TD", etc. with values from `tenantConfig` (or env).
- **Layout/shell:** Logo, app name, favicon, and theme (primary/secondary color) from config.
- **Routing/feature flags:** Optional features (e.g. Email Inbox, Approvals, Leaderboard) from `tenantConfig.features` so you can turn them on/off per client.
- **i18n:** If you add Arabic (UAE), use locale from config and RTL where needed.

---

## 3. Who Starts What — Complete System Flows

Below, **who** can start each flow and **who** has **what rights** at each step. This is the “100% understanding” of the system from a product perspective.

### 3.1 Role Summary (Who Has What Rights)

| Role | Who | Main rights |
|------|-----|-------------|
| **Admin** | System owner (your company or client’s IT). | Full access: all pages, all entities, departments, workflow stages, routing rules, team performance, Access Control, user roles. |
| **Department Admin** | Head of a department. | Same as Admin but **scoped to their department**: tasks, team, reports, routing, departments, workflow stages, settings. Cannot manage users outside department. |
| **Department Manager** | Manager within a department. | Manage tasks and team; view reports, departments, routing (read-only), settings. **Cannot** edit workflow stages or routing rules. |
| **Team Member** | Regular user. | View/create/edit **own or assigned** tasks; view team, reports, email, calendar; edit own profile; view settings. Kanban: move **own** tasks only. |
| **Editor** | Content/process editor. | View and edit tasks, team, reports, routing, departments; **no** department delete or full admin. |
| **Viewer** | Read-only. | View tasks, team, reports, routing, profile, email, departments, settings — no create/edit/delete. |
| **User** | Legacy. | Treated like Viewer + can edit own profile and create/edit own tasks (align with your RBAC). |

**Page access** (who can open which page) is defined in `src/components/shared/rbac.jsx` — see **PAGE_ACCESS**. Only **Admin** can open **AccessControl**; **TeamPerformanceDashboard** is Admin + Department Admin; **DepartmentManagement**, **WorkflowStageManagement** are Admin + Department Admin; **RoutingRules** add Editor; rest are broader.

---

### 3.2 Flow 1: Initial Setup (Who Starts: Admin)

| Step | Who | Action | Notes |
|------|-----|--------|-------|
| 1 | Admin | Create departments (Department Management). | Defines structure (e.g. Tourism, Statistics, Media). |
| 2 | Admin | Create workflow stages (Workflow Stage Management). | Defines Kanban columns (e.g. Backlog, In Progress, Done). |
| 3 | Admin | Optionally define routing rules (Routing Rules). | So incoming emails can be auto-categorized/assigned. |
| 4 | Admin | Invite/add users and assign roles (Team or User Management / Access Control). | Each user gets role (admin, department_admin, department_manager, team_member, etc.) and department. |
| 5 | Admin | Configure mailboxes / email integration (if used). | So emails can be ingested into Email Inbox. |

**Rights:** Only **Admin** (and where applicable **Department Admin**) can perform these steps. This flow does **not** depend on Base44; you implement it with your own auth and DB (e.g. Firebase Auth + Firestore + Cloud Functions).

---

### 3.3 Flow 2: Email → Task (Who Starts: Any role with Email Inbox access)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | System | Emails arrive (ingestion). | Backend/webhook creates **EmailMessage** (status: new). |
| 2 | Backend (optional) | Apply routing rules. | Auto-set category, assignee, priority. |
| 3 | User (Inbox) | Open Email Inbox, see list. | Needs **email:view**. |
| 4 | User | Triage: set category, assign to user, star, mark read. | Same; status → triaged when assigned/categorized. |
| 5a | User | **Convert to task:** click “Convert to task” → Task Form (pre-filled from email). | Needs **tasks:create**. |
| 5b | User | On save: new **Task** created; email updated (linked_task_id, status → converted). | Backend or client + API. |
| 6 | User | Or **Link to existing task:** pick task → email linked, status → converted. | Needs **tasks:view** (and usually edit on task). |
| 7 | User | Or **Archive** email. | Status → archived. |

**Who can do what:** All roles with **Email Inbox** page access can view; only roles with **tasks:create** can convert; linking/archive depends on your permission design (e.g. same as edit).

---

### 3.4 Flow 3: Task Lifecycle (Who Starts: Admin / Manager / Team Member)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | Admin / Dept Admin / Manager / Team Member | **Create task** (Tasks → Create, or from email). | **tasks:create**. |
| 2 | Admin / Dept Admin / Manager | **Assign** lead/support (Task Form or Assignment UI). | **tasks:edit** (and optionally assignee notification via Cloud Function). |
| 3 | Assignee (Team Member) | **Update progress** (Task Detail / Task Form: status, completion %, subtasks, comments). | **tasks:edit** (own or assigned). |
| 4 | Admin / Dept Admin / Manager | **Move on Kanban** (drag to another stage). | **tasks:edit**; Kanban logic may restrict Team Member to own tasks only. |
| 5 | Admin / Dept Admin / Manager | **Complete / delete / bulk actions** (Tasks list). | **tasks:edit** / **tasks:delete**. |
| 6 | Optional | **Submit for approval** (if task has approval workflow). | **tasks:edit**; approvers get notification (Cloud Function or trigger). |

**Who can do what:** See **ROLE_PERMISSIONS** in `rbac.jsx`: Admin has all; Department Admin/Manager have tasks create/edit/delete; Team Member has create/edit for own; Viewer has only view.

---

### 3.5 Flow 4: Approvals (Who Starts: Task owner / Manager)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | User with **tasks:edit** | Mark task as “requires approval” and set approvers (Task Form / Task Detail). | **tasks:edit**. |
| 2 | Same user | **Submit for approval** (button → calls e.g. `submitForApproval`). | **tasks:edit**. |
| 3 | Backend | Create **TaskApproval** records; notify approvers. | Cloud Function. |
| 4 | Approver | Open task, approve/reject. | Permission: “can approve” (e.g. approver list or role). |
| 5 | Backend | Update task approval status; optional notification to requester. | Cloud Function. |

---

### 3.6 Flow 5: Reporting & Performance (Who Starts: Admin / Department Admin / Manager)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | Manager / Dept Admin / Admin | Open **Reports**: view metrics, charts, export. | **reports:view**, **reports:export**. |
| 2 | Admin / Dept Admin | Open **Team Performance Dashboard**: view AI insights, recommendations, alerts. | **TeamPerformanceDashboard** page access (Admin, Dept Admin only). |
| 3 | Backend | **Analyze performance** (e.g. `analyzeTeamPerformance`): reads tasks/team/departments, calls LLM, returns insights. | Cloud Function; caller must be authenticated Admin (or Dept Admin if scoped). |
| 4 | Admin / Dept Admin / Manager | Open **Leaderboard**: view member/department/sector rankings. | **Leaderboard** page access; data from e.g. `getLeaderboardData` Cloud Function. |

---

### 3.7 Flow 6: Notifications (Who Starts: System / Assigner)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | User (Admin/Manager) | Assigns task to user. | **tasks:edit**. |
| 2 | Backend | **assignTaskToUser** (or equivalent): update task, create **Notification** for assignee. | Cloud Function. |
| 3 | Assignee | Sees notification in Notification Center; marks read / deletes. | Any logged-in user sees own notifications. |
| 4 | System | Scheduled **due soon / overdue** notifications (e.g. `checkDueDateNotifications`). | Scheduled Cloud Function; writes to **Notification** collection. |

---

### 3.8 Flow 7: Profile & Settings (Who Starts: User / Admin)

| Step | Who | Action | Rights |
|------|-----|--------|--------|
| 1 | Any user | Open **Profile**, edit own name, phone, department, avatar. | **profile:edit_own**. |
| 2 | Admin | Edit **another user’s** profile (e.g. role, department). | **profile:edit_other**. |
| 3 | Any user | Open **Settings** / **Notification Preferences**, set notification toggles. | **settings:view**; only own preferences writable. |

---

## 4. What Comes from Base44 vs What You Build

### 4.1 Current (Base44 Starter)

| Layer | Provided by Base44 | Your code |
|-------|--------------------|-----------|
| **Frontend** | — | React app, pages, Layout, RBAC UI, all components. |
| **Auth** | Base44 auth (me, logout, updateMe, public settings). | AuthContext, login UI (if any), role from user. |
| **Data** | Base44 entities (User, Initiative, EmailMessage, Department, WorkflowStage, Notification, etc.). | All queries/mutations via Base44 client. |
| **Functions** | Base44 server functions (Deno in `functions/`): assignTaskToUser, suggestTaskAssignment, getLeaderboardData, analyzeTeamPerformance, createRecurringTaskInstances, checkDueDateNotifications, etc. | Invoked via `base44.functions.invoke(...)`. |
| **Hosting** | Base44 hosting (optional). | Vite build, deploy elsewhere if you want. |

### 4.2 Target (Your Own Product)

| Layer | You build / replace | Notes |
|-------|----------------------|-------|
| **Frontend** | **Keep** React app, pages, flows, RBAC. Add **tenant config** (branding, logo, colors, app name, locale). | Remove Base44 SDK; use your API client (Firebase or your backend). |
| **Auth** | **Replace** with Firebase Auth (or your IdP). Store role in custom claims or `users` collection. | AuthContext talks to Firebase Auth; role from claims or Firestore. |
| **Data** | **Replace** with Firestore (or your DB). Same entities; add **tenantId** if multi-tenant. | All list/get/create/update/delete go through your client + security rules. |
| **Functions** | **Replace** with Firebase Cloud Functions (or your backend). Port each Base44 function. | assignTaskToUser, getLeaderboardData, analyzeTeamPerformance, createRecurringTaskInstances, checkDueDateNotifications, etc. |
| **Email ingestion** | **You build** (webhook + Cloud Function or external service). | Emails → your API → create EmailMessage docs in Firestore. |
| **White-label** | **You build** (tenant config + UI using config). | Config per install or per tenant; no hardcoded branding. |
| **Installable** | **You build** (Docker/installer or per-tenant Firebase project). | Each client = own deploy or own tenant with strict isolation. |

### 4.3 Implementation Order (Suggested)

1. **Tenant/installation config** (app name, logo, colors) in frontend — no backend yet.
2. **Replace Base44 client** with Firebase (or your API) client; keep same entity shapes and page logic.
3. **Auth** with Firebase Auth + role in custom claims or user doc.
4. **Firestore** collections + security rules (with **tenantId** if multi-tenant).
5. **Cloud Functions** one by one: assignTaskToUser → getLeaderboardData → analyzeTeamPerformance → createRecurringTaskInstances → checkDueDateNotifications → others.
6. **Email ingestion** pipeline (webhook + rules).
7. **Installation packaging** (Docker or installer) and/or multi-tenant config endpoint.

---

## 5. Quick Reference: Who Can Do What

| Action | Admin | Dept Admin | Dept Manager | Team Member | Editor | Viewer |
|--------|-------|------------|--------------|-------------|--------|--------|
| Setup departments, workflow, routing | ✅ | ✅ (dept) | ❌ | ❌ | Partial (routing) | ❌ |
| Create / edit / delete any task | ✅ | ✅ | ✅ | Own/assigned | ✅ | ❌ |
| Assign task to anyone | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Move any task on Kanban | ✅ | ✅ | ✅ | Own only | ✅ | ❌ |
| View Reports, export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Performance Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Department Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Workflow Stage Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Routing Rules (edit) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Access Control (roles) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit other users’ profiles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Triage / convert email to task | ✅ | ✅ | ✅ | ✅ | ✅ | View only |

This document is the single reference for **product vision**, **white-label/installable design**, **end-to-end flows**, **who starts what**, **who has what rights**, and **what to implement from Base44 vs yourself**.
