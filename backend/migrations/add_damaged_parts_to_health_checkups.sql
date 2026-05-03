-- Keep older health_checkups tables aligned with the current checkup payload.

ALTER TABLE health_checkups
ADD COLUMN IF NOT EXISTS damaged_parts JSONB DEFAULT '[]'::jsonb;

UPDATE health_checkups
SET damaged_parts = COALESCE(damaged_parts, '[]'::jsonb)
WHERE damaged_parts IS NULL;
