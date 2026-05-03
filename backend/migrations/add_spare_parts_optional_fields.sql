-- Keep older spare_parts tables aligned with the current API payload.

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS serial VARCHAR(50);

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'New';

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS printer_model VARCHAR(100);

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

UPDATE spare_parts
SET condition = COALESCE(condition, 'New'),
    plant_location = COALESCE(plant_location, 'B26')
WHERE condition IS NULL
   OR plant_location IS NULL;
