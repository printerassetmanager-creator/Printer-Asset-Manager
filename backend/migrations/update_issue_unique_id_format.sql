-- Update issue ID format from ISU000001 to ISSU01 style
UPDATE issues
SET issue_unique_id = 'ISSU' || LPAD(id::text, 2, '0');
