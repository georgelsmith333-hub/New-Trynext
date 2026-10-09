# T8 — Persistent duplicate-order protection: migration design and dry-run report

Status: **design and dry run only. Nothing in this plan has been run against any live database, and no application code or schema file has been changed.** Running it needs a separate owner approval for this exact change.

## Problem
Duplicate-submit protection for `POST /api/orders` (`artifacts/api-server/src/lib/idempotency.ts`) is in memory: per process, 30 minutes, 1000 entries. A server restart, a second API instance, or a retry that arrives after a restart can still create a second order for one checkout attempt.

## Proposed change (reversible)
Two nullable columns and one partial unique index on `orders` (`claude/t8/up.sql`, rollback `claude/t8/down.sql`):

| Object | Why |
| --- | --- |
| `orders.idempotency_key TEXT NULL` | the browser's per-attempt `Idempotency-Key` |
| `orders.idempotency_fingerprint TEXT NULL` | sha256 of the request body, to refuse a key reused with a different cart |
| unique index `orders_idempotency_key_uidx` `WHERE idempotency_key IS NOT NULL` | the database itself refuses a second order with the same key |

Safe on a live table: adding nullable columns without a default is metadata-only (no rewrite); the index is partial and built `CONCURRENTLY`, and every existing row has `NULL`, so nothing can collide. The two statements must be run separately (`CREATE INDEX CONCURRENTLY` cannot run in a transaction).

## Application change that would follow (not written yet)
1. At startup check once whether the columns exist (`information_schema.columns`). If they do not, behave exactly as today (in-memory only). This makes the order of "deploy code" and "run migration" harmless.
2. In `POST /orders`, store `idempotency_key` and the fingerprint in the same insert, inside the existing transaction that takes stock and promo use.
3. If the insert fails with unique violation `23505` on `orders_idempotency_key_uidx`, the whole transaction (stock, promo, order) rolls back, then: same fingerprint → look up the existing order by key and replay its normal reply with no new notifications; different fingerprint → `409 idempotency_key_reused`.
4. Two simultaneous requests with one key: the second waits on the unique index until the first commits, then takes the `23505` path above.
5. Keep the in-memory layer in front of it (cheap fast path).
Tests would use the same throwaway-Postgres approach as T7.

## Dry run (done locally, throwaway Postgres, not live)
Run on a scratch local database created from the repo schema (`pnpm --filter @workspace/db run push`), with two existing look-alike orders:
- `up.sql`: columns added, index created; existing rows keep `NULL` keys (2 of 2).
- Re-running `up.sql` is a no-op (`IF NOT EXISTS`).
- First insert with a key succeeds; a second insert with the same key is refused: `duplicate key value violates unique constraint "orders_idempotency_key_uidx"` (23505).
- Many rows with `NULL` key are still allowed.
- Collision report (`claude/t8/collision-report.sql`, part 1) returns zero rows.
- `down.sql`: both columns and the index are gone, all 4 orders kept.

## Collision / uniqueness analysis
- New columns start `NULL`; there are no historic keys, so **no collision is possible at migration time**.
- `claude/t8/collision-report.sql` part 2 is a read-only report of historic look-alike orders (same phone, same total, under 5 minutes apart) to show how often the in-memory guard was bypassed. It changes nothing and prints only order numbers and a 3-digit phone suffix. It has **not** been run on live data; the owner/operator can run it read-only and paste the sanitized output if wanted.

## Correction found on 2026-10-09: a plain `idempotency_key` column may already exist
`repairTargetSchemas()` in `dbBackupSync.ts` (runs only when `ALLOW_DB_SCHEMA_REPAIR=true`) already executes `ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text` on the backup targets, and its comment says the production mirror was ahead of the shared schema package. So the backup database, and possibly the primary, may **already have the column, possibly with values in it**. `up.sql` stays safe (`IF NOT EXISTS`), but:
- **Before** building the unique index, run part 1 of `claude/t8/collision-report.sql` on each database and also `SELECT count(*), count(idempotency_key) FROM orders`. If any key appears twice, `CREATE UNIQUE INDEX` will fail (it will not damage anything, but the duplicates must be reviewed first; do not delete or rewrite orders to make it pass).
- Check which of the two columns each database already has before choosing which statements to run.
- The operator's note `docs/IDEMPOTENCY_KEY_MIGRATION_DRY_RUN.md` (open PR #40) proposes the same index on one column without the fingerprint column; the extra fingerprint column here is only for refusing a reused key with a different cart and can be dropped if a smaller change is preferred.

## Important rollout constraint (found in `dbBackupSync.ts`)
The backup mirror is fail-closed: if the **primary** has a column the **backup** database lacks, the sync stops with `Schema mismatch ... column missing on target. Run migrations on the target first.` Therefore:
1. Take a Neon restore point/branch of both databases first.
2. Apply `up.sql` to the **backup/target** database first, then to the **primary**.
3. Verify with `SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name LIKE 'idempotency%'` on both.
4. Only then deploy the application change.
5. Confirm the next backup sync passes. (The mirror inserts with `ON CONFLICT DO NOTHING` and an explicit column list, so the new index is compatible.)

## Rollback
Application: revert the code (it falls back to in-memory behaviour). Database: `claude/t8/down.sql` (drops the index and both columns; only the stored keys are lost, no order data). Apply to the primary first, then the backup, the reverse of the forward order.

## What is needed from the owner
An explicit "yes, run T8 on <environment>" for this exact change, who runs it (provider access is outside Claude's remit), and confirmation of the Neon restore points. Until then nothing here is applied.
