-- Add assigned_to column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);

-- Update activity log to track assignments
ALTER TABLE issue_activity_log ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
