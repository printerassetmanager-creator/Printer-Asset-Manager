-- Add plant_location column to existing tables

-- Add to printers table
ALTER TABLE printers
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

-- Add to vlan table
ALTER TABLE vlan
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

-- Add to spare_parts table
ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

-- Add to hp_printers table
ALTER TABLE hp_printers
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

-- Add to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26';

-- Update any existing rows to have default plant_location if NULL
UPDATE printers SET plant_location = 'B26' WHERE plant_location IS NULL;
UPDATE vlan SET plant_location = 'B26' WHERE plant_location IS NULL;
UPDATE spare_parts SET plant_location = 'B26' WHERE plant_location IS NULL;
UPDATE hp_printers SET plant_location = 'B26' WHERE plant_location IS NULL;
UPDATE issues SET plant_location = 'B26' WHERE plant_location IS NULL;
