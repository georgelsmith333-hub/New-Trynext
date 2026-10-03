# In Progress — Phase 8 Database Schema Hardening

> **Superseded status — reconciled 2026-10-04.** This file is a July 2026 snapshot and its status
> values are stale. Evidence-checked results are in `All Tasks Left To Do/CRITICAL_FINDINGS.md`
> (section "Reconciliation 2026-10-04") and the newest section of `AGENT_HANDOFF.md`. Do not treat an
> unchecked box here as an open defect without re-verifying it against the current code.

**Status:** In Progress  
**Started:** 2026-07-22  
**Owner:** Main agent

---

## Goal

Normalize the database schema, add missing foreign keys, indexes, check constraints, and data integrity rules. This is foundational to every other feature.

---

## Tasks planned

- [ ] Add foreign key references to all integer relation columns.
- [ ] Add indexes on foreign keys and frequently filtered columns.
- [ ] Add check constraints for prices, totals, ratings, stars, counts, and status enums.
- [ ] Convert status/role/discount type columns from plain text to constrained values.
- [ ] Clean up orphaned records before adding foreign keys.
- [ ] Generate / run Drizzle migration to apply changes.
- [ ] Verify typecheck passes after schema changes.
- [ ] Verify API server still builds and starts.

---

## Tasks completed

- [ ] None yet — this phase just started.

---

## Notes

- The schema is in `lib/db/src/schema/index.ts`.
- Migrations are managed via `drizzle-kit` and `lib/db/drizzle.config.ts`.
- Foreign keys will use `ON DELETE SET NULL` for optional relations and `ON DELETE CASCADE` for required ones where safe.
- Status columns will use `CHECK` constraints to enforce valid values.

---

**Last Updated:** 2026-07-22
