-- Migration: Make DN unique in cartridges table
-- Purpose: Each cartridge must have a separate, unique DN (Distributor Number)
-- Date: April 19, 2026

-- Add UNIQUE constraint to dn column
ALTER TABLE cartridges 
  ALTER COLUMN dn SET NOT NULL,
  ADD CONSTRAINT cartridges_dn_unique UNIQUE(dn);

-- Verify constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'cartridges' AND constraint_type = 'UNIQUE';
