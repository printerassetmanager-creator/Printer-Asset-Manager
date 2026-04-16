-- Add issue activity tracking and timeline support
ALTER TABLE issues ADD COLUMN IF NOT EXISTS severity_at_resolve VARCHAR(20);
ALTER TABLE issues ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMP;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS breach_status VARCHAR(20) DEFAULT 'on-track';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS last_activity_user VARCHAR(100);

-- New table for issue activity history
CREATE TABLE IF NOT EXISTS issue_activity_log (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  old_severity VARCHAR(20),
  new_severity VARCHAR(20),
  reason TEXT,
  action_taken TEXT,
  severity_at_time VARCHAR(20),
  user_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_issue_activity_issue_id ON issue_activity_log(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_status ON issues(status);
