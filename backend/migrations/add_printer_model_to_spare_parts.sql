-- Add printer_model column to spare_parts table

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS printer_model VARCHAR(100);