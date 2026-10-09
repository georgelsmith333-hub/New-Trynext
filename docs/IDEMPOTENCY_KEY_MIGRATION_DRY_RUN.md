# Persistent order idempotency key — migration design and dry run

**Status:** Prepared only. **Not executed.** No database connection or live data was changed.

## Current state

- The API already accepts an `Idempotency-Key` header and has an in-memory guard.
- The checked-in Drizzle `orders` schema currently has no `idempotency_key` column.
- A backup-sync helper contains an additive `ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text`, but that is not a production migration and does not provide a uniqueness guarantee.

## Proposed reversible migration

```sql
-- UP: execute only after a separate approval and collision review
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS orders_idempotency_key_uq
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- DOWN: execute only with a separate rollback approval
DROP INDEX CONCURRENTLY IF EXISTS orders_idempotency_key_uq;
ALTER TABLE orders DROP COLUMN IF EXISTS idempotency_key;
```

The unique index is partial so legacy orders with NULL remain valid. `CONCURRENTLY` requires running outside a transaction. The application must write the key only after request validation and must treat a unique-conflict as an idempotent replay, not as a generic 500.

## Dry-run queries — read-only

```sql
SELECT COUNT(*) AS total_orders,
       COUNT(*) FILTER (WHERE idempotency_key IS NOT NULL) AS keyed_orders
FROM orders;

SELECT idempotency_key, COUNT(*) AS occurrences,
       MIN(id) AS first_order_id, MAX(id) AS last_order_id
FROM orders
WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1
ORDER BY occurrences DESC, idempotency_key;

SELECT COUNT(*) AS blank_keys
FROM orders
WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) = '';

SELECT COUNT(*) AS distinct_nonblank_keys
FROM orders
WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';
```

## Release gate

Do not execute the migration until the dry run reports zero duplicate non-NULL keys and zero blank keys, the application conflict behavior is tested, a backup/rollback window is identified, and the owner separately approves execution. No live schema change is authorized by the current task.
