-- Add unique issue ID column (ISU001, ISU002, etc.)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS issue_unique_id VARCHAR(20) UNIQUE;

-- Create a sequence for generating issue IDs
CREATE SEQUENCE IF NOT EXISTS issue_id_seq START WITH 1 INCREMENT BY 1;

-- Populate existing issues with unique IDs if not already populated
UPDATE issues 
SET issue_unique_id = 'ISU' || LPAD(id::text, 5, '0')
WHERE issue_unique_id IS NULL;

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_issue_unique_id ON issues(issue_unique_id);

-- Add constraint to ensure issue_unique_id is not null for new issues
ALTER TABLE issues ALTER COLUMN issue_unique_id SET NOT NULL;
