# Next.js Demo: Build from Scratch with Server API

This doc describes how to build a **Gov-Flow demo** as a **Next.js app from scratch**, replacing Base44 auth and backend with **Next.js server API** (Route Handlers + optional Server Actions) so you have a self-contained demo.

---

## 1. Is This Feasible?

**Yes.** You can:

- Build the app **from scratch** in Next.js (App Router recommended).
- **Replace auth** with **NextAuth.js** (or a simple session-based auth).
- **Replace the backend** with **Next.js API routes** (Route Handlers in `app/api/...`) that read/write to a simple DB (SQLite, JSON file, or in-memory for demo).
- Reuse **concepts and logic** from this repo (RBAC, page flows, entity shapes) and optionally copy **UI components** (shadcn) into the Next.js project.

Result: a **single Next.js codebase** that runs locally (or on Vercel) with no Base44 dependency — ideal for a **first-initiative demo**.

---

## 2. Target Stack (Next.js Demo)

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14+ (App Router) |
| **Auth** | NextAuth.js (credentials provider for demo; can add Google/Microsoft later) |
| **Backend** | Next.js Route Handlers (`app/api/...`) — no separate server |
| **Data (demo)** | SQLite (e.g. `better-sqlite3`) or JSON file or in-memory store |
| **UI** | React, Tailwind, shadcn/ui (copy components into Next.js) |
| **State / server data** | React Query (TanStack Query) or Server Components + Server Actions |

---

## 3. What You Replace vs Reuse

### Replace (no Base44)

| Current (Vite + Base44) | Next.js demo |
|------------------------|-------------|
| `base44.auth.me()`, `logout()`, `updateMe()` | NextAuth.js `getServerSession()`, `signIn()`, `signOut()`; session holds `user.id`, `user.role`, `user.departmentId` |
| `base44.entities.Initiative.list()` etc. | `fetch('/api/tasks')`, `fetch('/api/users')`, etc. → Route Handlers read from DB |
| `base44.functions.invoke('assignTaskToUser', ...)` | `fetch('/api/actions/assign-task', { method: 'POST', body: ... })` → Route Handler updates DB + creates notification |
| AuthContext + Base44 public settings | NextAuth session + optional tenant config in env or `app/api/config/route.js` |

### Reuse (copy or reimplement)

| From this repo | In Next.js demo |
|----------------|-----------------|
| **RBAC** | Copy `rbac.jsx` logic (ROLES, PERMISSIONS, PAGE_ACCESS, `canAccessPage`) — use in Layout and middleware |
| **Page concepts** | Same pages: Tasks, TaskDetail, TaskForm, Kanban, Team, Reports, etc. — rebuild as `app/(dashboard)/tasks/page.jsx` etc. |
| **Entity shapes** | Same fields for Task, User, Department, WorkflowStage (see DOCUMENTATION.md §4) |
| **UI** | Copy shadcn components + Tailwind config into Next.js app |

---

## 4. Minimal Demo Scope (First Initiative)

To ship a **demo** quickly, implement only what’s needed to show the flow:

| Priority | What | Why |
|----------|------|-----|
| **P0** | **Auth** — Login (email/password or magic link), logout, session with `user.id` + `user.role` | So you can show role-based UI |
| **P0** | **Tasks** — List, detail, create/edit form | Core value of the product |
| **P0** | **API** — `GET/POST/PUT/DELETE` for tasks (and optionally users) | Backend lives in Next.js |
| **P1** | **Users** — List (for assignee dropdown); optional profile | Needed for assignment and team view |
| **P1** | **Departments** — List (optional create/edit) | Needed if you filter by department |
| **P1** | **Workflow stages** — List; Kanban columns | So Kanban “move” works |
| **P2** | **Notifications** — List, mark read | Improves demo feel |
| **P2** | **Email Inbox** — List + “convert to task” (stub emails in DB) | Shows email→task story |

Omit for first demo: Routing Rules, Team Performance AI, Leaderboard, full Reports — add later.

---

## 5. Next.js Project Structure (Suggested)

```
gov-flow-demo/
├── app/
│   ├── layout.jsx                 # Root layout, session provider
│   ├── page.jsx                   # Redirect to /tasks or login
│   ├── login/page.jsx              # Login form
│   ├── (dashboard)/
│   │   ├── layout.jsx              # Sidebar + header (reuse Layout concept)
│   │   ├── tasks/
│   │   │   ├── page.jsx            # Task list
│   │   │   ├── [id]/page.jsx       # Task detail
│   │   │   └── new/page.jsx        # Task form (create)
│   │   ├── team/page.jsx
│   │   ├── reports/page.jsx
│   │   └── ...
│   └── api/
│       ├── auth/[...nextauth]/route.js   # NextAuth
│       ├── config/route.js                # Tenant/branding config (optional)
│       ├── tasks/
│       │   ├── route.js                   # GET list, POST create
│       │   └── [id]/route.js              # GET one, PUT, DELETE
│       ├── users/route.js                 # GET list (for assignee dropdown)
│       ├── departments/route.js           # GET list
│       ├── workflow-stages/route.js       # GET list
│       ├── notifications/route.js         # GET list, PATCH mark read
│       └── actions/
│           └── assign-task/route.js       # POST assignTaskToUser logic
├── lib/
│   ├── auth.js                     # NextAuth config, session type
│   ├── db.js                       # SQLite or file store
│   ├── rbac.js                     # Copy from this repo
│   └── api-client.js               # fetch wrappers for /api/tasks etc.
├── components/                     # Copy shadcn + your components
├── .env.local                     # NEXTAUTH_SECRET, DATABASE_URL (if needed)
└── package.json
```

---

## 6. Auth (NextAuth.js) — Details

- **Provider:** Credentials (email + password) for demo; store users in your DB (or hash compare in API).
- **Session:** Include `user.id`, `user.email`, `user.name`, `user.role`, `user.departmentId` (and optionally `tenantId` for white-label later).
- **Protection:** Middleware or HOC that checks `getServerSession()` and redirects to `/login` if unauthenticated; use `user.role` + `rbac.js` to hide/allow routes.
- **No Base44:** No `base44.auth` or public settings; env vars for app name/logo if you want tenant config later.

---

## 7. Backend (Next.js API) — Details

- **Route Handlers** in `app/api/*`:
  - **GET/POST** `api/tasks` — list (with optional filters) and create.
  - **GET/PUT/DELETE** `api/tasks/[id]` — one task, update, delete.
  - **GET** `api/users` — list users (for assignee dropdown).
  - **GET** `api/departments`, **GET** `api/workflow-stages` — list only for demo.
  - **GET** `api/notifications` — list for current user; **PATCH** to mark read.
  - **POST** `api/actions/assign-task` — body `{ taskId, userId }`; update task, create notification.
- **Data:** In demo, use SQLite or a JSON file; keep same entity shapes as DOCUMENTATION.md §4 so you can swap to Firebase/Postgres later.
- **Authorization:** In each Route Handler, read session; check `user.role` (and department if needed) before read/write.

---

## 8. How to Run the Demo

1. **Create Next.js app:** `npx create-next-app@latest gov-flow-demo --tailwind --app`.
2. **Install:** NextAuth, `better-sqlite3` (or use JSON file), TanStack Query, copy shadcn deps.
3. **Implement:** Auth (NextAuth + session), `lib/db.js` (seed tasks, users, departments, workflow stages), `app/api/*` routes, then dashboard layout + Tasks list/detail/form.
4. **Run:** `npm run dev` → open `http://localhost:3000`, login, use Tasks and (optionally) Kanban/Team.

---

## 9. Summary

| Question | Answer |
|----------|--------|
| Can we build from scratch with Next.js? | **Yes.** |
| Replace auth? | **Yes** — use NextAuth.js (or simple session); no Base44. |
| Replace backend? | **Yes** — use Next.js Route Handlers as the only “backend”; DB can be SQLite/JSON for demo. |
| Demo scope? | Auth + Tasks (list, detail, form) + Users/Departments/Stages + optional Notifications and stub Email Inbox. |
| Reuse from this repo? | RBAC logic, entity shapes, page concepts, and optionally UI components (shadcn). |

This gives you a **self-contained Next.js demo** with your own auth and server API, so you can validate the product and later point the same UI at Firebase or another backend if needed.
