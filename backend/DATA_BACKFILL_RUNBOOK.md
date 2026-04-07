# GovFlow Invite/Leaderboard Data Backfill Runbook

## Scope

Use this one-time checklist to clean existing records so invite activation and leaderboard analytics are consistent.

## 1) Backup before changing data

- Export current `users`, `departments`, `teammembers`, and `tasks` collections.
- Keep a timestamped backup snapshot before any writes.

## 2) Normalize users

- For all `status: "active"` users, ensure:
  - `department` is populated and matches a canonical department name.
  - `position` is populated for reporting/leaderboard enrichment.
- For users with duplicate email casing, normalize `email` to lowercase.
- For invited users stuck in `pending` with a valid `invite_token`, keep as-is.
- For invited users where delivery failed, set a retry workflow by re-running invite from admin UI.

## 3) Normalize departments

- Ensure every department has:
  - `name` (unique canonical label)
  - `sector` (canonical sector label)
- Merge duplicate department names that differ by spacing/casing.
- Ensure all departments referenced by users/team members exist in `departments`.

## 4) Normalize team members

- Ensure each team member has canonical:
  - `department_name`
  - `sector_name`
- Align `teammembers.department_name` with `users.department` and `departments.name`.
- Align `teammembers.sector_name` with `departments.sector`.

## 5) Validate invite delivery metadata

- Review users with `invite_delivery_status: "failed"`.
- Retry invite from admin UI to regenerate token and resend email.
- Confirm successful retries update:
  - `invite_delivery_status` to `queued`
  - `invite_sent_at`
  - `invite_delivery_provider_id`

## 6) Refresh and verify leaderboard

- Re-run leaderboard API after cleanup.
- Verify no unexpected `Unknown` values for users/departments that have mapped data.
- Spot check:
  - Member department/sector values
  - Department sector groupings
  - Sector aggregates

## 7) Production verification pass

- Invite a new user and confirm delivery metadata is returned.
- Accept invite and confirm user transitions to `active`.
- Create and complete sample tasks; ensure leaderboard reflects expected department/sector.
