-- T8 rollback (NOT EXECUTED anywhere live). Only the stored keys are lost; no order data is touched.
DROP INDEX CONCURRENTLY IF EXISTS orders_idempotency_key_uidx;
ALTER TABLE orders
  DROP COLUMN IF EXISTS idempotency_fingerprint,
  DROP COLUMN IF EXISTS idempotency_key;
