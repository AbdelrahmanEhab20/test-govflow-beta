# Demo / beta pre-share checklist

Use this before sharing `test-govflow-beta.vercel.app` (or any demo URL) with external clients.

## 1. Clean operational data (optional but recommended)

From `backend/` against the **beta** MongoDB (`MONGO_URI`):

```bash
# Preview what will be deleted (safe)
npm run cleanup:demo

# Apply: wipe tasks/emails/activity; keep role=admin users + departments/stages/RBAC
npm run cleanup:demo -- --apply

# Optional flags
# --keep-team-members     keep Team directory rows
# --clear-routing-rules   also delete email routing rules
# --reset-mailboxes       clear OAuth mailboxes on admin accounts
```

Do **not** run `npm run seed` for cleanup — seed wipes admins and reseeds demo clutter.

After cleanup, invite a temporary Team Member if you want to show role-scoped tasks.

## 2. Set branding for this client

1. Sign in as **Admin**
2. Open **Settings → General**
3. Set Organization / App name, sidebar title, tagline, colors, logo
4. Click **Save Branding** (persists in Mongo; no Render redeploy)
5. Sign out and confirm **Login** shows the new name/logo/footer

To reset to product defaults: set names back to `GovFlow`, tagline `Workflow System`, env label `beta`.

### Render bootstrap (first paint only)

Env `BRAND_*` values are **defaults until** Settings is saved. On Render, keep them generic (`GovFlow`), not a client company name. After an admin saves branding, DB overrides env.

Suggested Render values:

| Variable | Value |
|----------|--------|
| `BRAND_APP_NAME` | `GovFlow` |
| `BRAND_COMPANY_NAME` | `GovFlow` |
| `BRAND_SIDEBAR_TITLE` | `GovFlow` |
| `BRAND_TAGLINE` | `Workflow System` |
| `BRAND_ENV_LABEL` | `beta` |
| `BRAND_SHOW_GOVFLOW_CREDIT` | `true` |
| `BRAND_LOGO_URL` | `/logo.svg` |

## 3. Accounts & roles

- [ ] Share **Admin** credentials only if the client needs full access; prefer a Manager + Team Member pair when possible
- [ ] Team Member sees only own assigned tasks (My Tasks)
- [ ] Temporary passwords; share via secure channel
- [ ] Rotate or deactivate demo accounts after the review window

## 4. First-impression checks

- [ ] Login: no client-specific leftover name unless intentional for this demo
- [ ] Sidebar title/logo match Settings branding
- [ ] Dashboard / Team Activity empty or neutral (no personal/test email subjects)
- [ ] Browser tab title and favicon look correct

## 5. Smoke test (~10 minutes)

1. Login → branding OK  
2. Admin: Dashboard, Tasks, Kanban, Team, Reports load  
3. Create/edit one task; status and Kanban stay aligned  
4. Team Member: only own tasks  
5. Email Inbox: connected or clear reconnect CTA  
6. Sign out / Forgot password link present  

## 6. Reliability / security notes for clients

- Free Render cold start: first API call after idle may take 30–60s — warm the app before the call  
- Confirm `FRONTEND_URL` / `CORS_ORIGINS` / `APP_URL` point at the Vercel beta URL  
- Password reset / invites only work if SendGrid (or configured mail) is live  
- Confirm `ALLOW_DEV_LOGIN` is off on the shared beta if the URL is public  
- No real PII or production client mailboxes in the shared DB  

## 7. Handoff message template

> Demo URL: https://test-govflow-beta.vercel.app  
> Login: \<email\> / \<temp password\>  
> Note: first load may be slow after idle (server wake-up).  
> Branding and sample data are for evaluation only.
