# In Progress — Phase 14 Deployment Fixes + Backup Sync Safety

> **Superseded status — reconciled 2026-10-04.** This file is a July 2026 snapshot and its status
> values are stale. Evidence-checked results are in `All Tasks Left To Do/CRITICAL_FINDINGS.md`
> (section "Reconciliation 2026-10-04") and the newest section of `AGENT_HANDOFF.md`. Do not treat an
> unchecked box here as an open defect without re-verifying it against the current code.

**Status:** In Progress  
**Started:** 2026-07-22  
**Owner:** Main agent

---

## Goal

Fix the most dangerous deployment and backup issues before moving to frontend features.

---

## Tasks planned

- [ ] Remove hardcoded Render backend URL from Cloudflare Pages proxy (`functions/api/[[path]].ts`).
- [ ] Make `API_URL` required in CF Pages proxy (fail closed if missing).
- [ ] Make API server environment validation stricter and fail on missing critical env vars.
- [ ] Fix backup sync safety (`lib/dbBackupSync.ts`): remove `TRUNCATE ... CASCADE`, remove auto-heal schema mutations, add verification step.
- [ ] Add or verify health check endpoint that checks DB, Redis, storage.
- [ ] Document CI/CD requirements (even if not fully implemented yet).
- [ ] Rebuild and restart API server after changes.
- [ ] Run full typecheck after all changes.

---

## Tasks completed

- [ ] None yet — this phase just started.

---

## Notes

- The CF Pages proxy currently falls back to `https://trynex-api.onrender.com` if `API_URL` is missing. This must be removed so the proxy fails closed.
- The backup sync uses `TRUNCATE ... CASCADE` on target databases before inserting, which is destructive. It must be replaced with a safer incremental/merge strategy or at least a verification step before truncation.
- The backup sync also auto-heals target schemas by altering columns, which bypasses migration versioning. This must be removed.

---

**Last Updated:** 2026-07-22
