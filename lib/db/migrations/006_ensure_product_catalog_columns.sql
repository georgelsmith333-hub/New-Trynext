-- Keep the external production catalog compatible with the current product
-- reader. This is intentionally idempotent because Render databases may have
-- been provisioned from an older schema snapshot.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE products
SET
  images = COALESCE(images, '[]'::jsonb),
  sizes = COALESCE(sizes, '[]'::jsonb),
  colors = COALESCE(colors, '[]'::jsonb),
  tags = COALESCE(tags, '[]'::jsonb),
  color_variants = COALESCE(color_variants, '[]'::jsonb),
  variants = COALESCE(variants, '[]'::jsonb),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE products
  ALTER COLUMN images SET DEFAULT '[]'::jsonb,
  ALTER COLUMN sizes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN colors SET DEFAULT '[]'::jsonb,
  ALTER COLUMN tags SET DEFAULT '[]'::jsonb,
  ALTER COLUMN color_variants SET DEFAULT '[]'::jsonb,
  ALTER COLUMN variants SET DEFAULT '[]'::jsonb,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();