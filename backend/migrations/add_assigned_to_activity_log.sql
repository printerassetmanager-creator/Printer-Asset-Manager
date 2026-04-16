-- Add assigned_to column to issue_activity_log table if it doesn't exist
ALTER TABLE issue_activity_log
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
