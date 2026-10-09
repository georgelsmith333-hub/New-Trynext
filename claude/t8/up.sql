-- T8 (NOT EXECUTED anywhere live). Persistent duplicate-order protection.
-- Safe on a live table: both columns are nullable with no default (metadata-only,
-- no table rewrite); the unique index is partial so existing rows (NULL) never collide.
-- Run the two statements separately: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_fingerprint TEXT;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS orders_idempotency_key_uidx
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
