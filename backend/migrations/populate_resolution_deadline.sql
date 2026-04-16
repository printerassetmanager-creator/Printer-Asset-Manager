-- Set resolution_deadline for all existing issues based on severity
UPDATE issues 
SET resolution_deadline = CASE 
  WHEN severity = 'High' THEN created_at + INTERVAL '1 day'
  WHEN severity = 'Medium' THEN created_at + INTERVAL '3 days'
  WHEN severity = 'Low' THEN created_at + INTERVAL '7 days'
  ELSE created_at + INTERVAL '3 days'
END
WHERE resolution_deadline IS NULL;

-- Set status_changed_at for all existing issues
UPDATE issues 
SET status_changed_at = created_at
WHERE status_changed_at IS NULL;
