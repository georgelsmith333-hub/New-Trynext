-- Real Smart Object mockup renderer: template registry + async job queue.
-- Idempotent for existing Neon/Render environments.

CREATE TABLE IF NOT EXISTS mockup_templates (
  id SERIAL PRIMARY KEY,
  product_type TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  face TEXT,
  file_path TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_sha256 TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  smart_object_id TEXT,
  smart_object_name TEXT,
  inspection_json JSONB,
  output_width INTEGER,
  output_height INTEGER,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  last_validated_at TIMESTAMP,
  last_validation_status TEXT,
  last_validation_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT mockup_templates_file_format_check CHECK (file_format IN ('psd', 'psb')),
  CONSTRAINT mockup_templates_validation_status_check CHECK (last_validation_status IS NULL OR last_validation_status IN ('pass', 'fail'))
);

CREATE INDEX IF NOT EXISTS mockup_templates_product_type_idx ON mockup_templates(product_type);
CREATE INDEX IF NOT EXISTS mockup_templates_active_idx ON mockup_templates(active);

CREATE TABLE IF NOT EXISTS mockup_jobs (
  id TEXT PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES mockup_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  artwork_path TEXT NOT NULL,
  artwork_hash TEXT NOT NULL,
  render_options JSONB DEFAULT '{}',
  cache_key TEXT NOT NULL,
  rendering_engine TEXT,
  preview_url TEXT,
  final_url TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT mockup_jobs_status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS mockup_jobs_status_idx ON mockup_jobs(status);
CREATE INDEX IF NOT EXISTS mockup_jobs_cache_key_idx ON mockup_jobs(cache_key);
CREATE INDEX IF NOT EXISTS mockup_jobs_template_id_idx ON mockup_jobs(template_id);
