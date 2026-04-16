-- Create i-learn features: Issues and Resolution Steps with Images

CREATE TABLE IF NOT EXISTS i_learn_issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'General',
  keywords TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS i_learn_steps (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES i_learn_issues(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_issues_category ON i_learn_issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON i_learn_issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_steps_issue_id ON i_learn_steps(issue_id);
CREATE INDEX IF NOT EXISTS idx_steps_step_number ON i_learn_steps(step_number);
