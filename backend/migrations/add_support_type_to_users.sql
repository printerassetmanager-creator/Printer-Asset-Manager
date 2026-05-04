ALTER TABLE users
  ADD COLUMN IF NOT EXISTS support_type VARCHAR(30) DEFAULT 'technical';

UPDATE users
SET support_type = 'technical'
WHERE support_type IS NULL;

