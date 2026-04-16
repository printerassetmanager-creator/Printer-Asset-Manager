-- Add SAP and MES printer numbers to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS sapno VARCHAR(50);
ALTER TABLE issues ADD COLUMN IF NOT EXISTS mesno VARCHAR(50);
