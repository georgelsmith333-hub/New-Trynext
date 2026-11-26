-- Durable order idempotency records.
-- Release gate: apply only after code and rollback procedures are reviewed.
-- Expired rows are removed by the API middleware; this table is not customer data.
CREATE TABLE IF NOT EXISTS order_idempotency_keys (
  key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT order_idempotency_keys_state_check CHECK (state IN ('pending', 'done'))
);

CREATE INDEX IF NOT EXISTS order_idempotency_keys_expires_at_idx
  ON order_idempotency_keys (expires_at);
