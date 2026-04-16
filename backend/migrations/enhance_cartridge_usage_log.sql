-- Enhance cartridge usage log with explicit printer location tracking
ALTER TABLE cartridge_usage_log
ADD COLUMN IF NOT EXISTS printer_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS printer_tag VARCHAR(50);

-- Create index for better performance on usage queries
CREATE INDEX IF NOT EXISTS idx_cartridge_usage_dn ON cartridge_usage_log(dn);
CREATE INDEX IF NOT EXISTS idx_cartridge_usage_used_at ON cartridge_usage_log(used_at DESC);
