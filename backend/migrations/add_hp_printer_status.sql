-- Add error status and last sync timestamp to hp_printers table

ALTER TABLE hp_printers
ADD COLUMN IF NOT EXISTS error_status VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_cartridge_sync TIMESTAMP;

-- Update existing rows
UPDATE hp_printers SET last_cartridge_sync = NOW() WHERE last_cartridge_sync IS NULL;
