# In Progress — Phase 2 Security Fixes

> **Superseded status — reconciled 2026-10-04.** This file is a July 2026 snapshot and its status
> values are stale. Evidence-checked results are in `All Tasks Left To Do/CRITICAL_FINDINGS.md`
> (section "Reconciliation 2026-10-04") and the newest section of `AGENT_HANDOFF.md`. Do not treat an
> unchecked box here as an open defect without re-verifying it against the current code.

**Status:** In Progress  
**Started:** 2026-07-22  
**Owner:** Main agent

---

## Goal

Remove all hardcoded security fallbacks and close the most dangerous attack surfaces before moving on to features.

---

## Tasks completed

- [x] Disabled runtime secret updates in `src/routes/secrets.ts` (`/admin/secrets/update` and `/admin/secrets/bulk-update` now return 403).
- [x] Removed hardcoded JWT fallback in `src/lib/customerAuth.ts`.
- [x] Removed hardcoded JWT fallback in `src/routes/auth.ts`.
- [x] Removed hardcoded customer salt fallback in `src/routes/auth.ts`.
- [x] Removed hardcoded admin password and legacy salt fallbacks in `src/routes/admin.ts`.
- [x] Made `verifyPasswordAny` accept an optional legacy salt so legacy SHA-256 verification only works when `ADMIN_SALT`/`CUSTOMER_SALT` is explicitly configured.
- [x] `pnpm --filter @workspace/api-server run typecheck` passes.
- [x] API server rebuilt successfully (`node ./build.mjs`).

---

## Tasks still in progress

- [x] Restart the API server workflow and verify it starts cleanly. *(Verified 2026-10-04: built bundle booted against a fresh local Postgres with 0 error-level log lines.)*
- [x] Verify the admin login still works with the configured `ADMIN_PASSWORD` env var. *(Verified 2026-10-04: admin login returned a session token on the local API; admin routes returned 401 without it.)*
- [x] Verify the customer auth still works with the configured `JWT_SECRET` env var. *(Verified 2026-10-04: register and login returned tokens; a wrong password returned 401.)*

---

## Notes

- `CUSTOMER_SALT` and `ADMIN_SALT` are now optional. If not set, legacy SHA-256 password hashes will not verify. This is intentional: new deployments use argon2 only. Existing deployments that still have SHA-256 admin/customer hashes must set these env vars explicitly.
- The server will still fail to start if `JWT_SECRET` or `ADMIN_PASSWORD` is missing.

---

**Last Updated:** 2026-07-22
