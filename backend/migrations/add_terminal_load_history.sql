-- Add historical terminal load data table
CREATE TABLE IF NOT EXISTS app_support_terminal_history (
  id SERIAL PRIMARY KEY,
  terminal_code VARCHAR(30) NOT NULL,
  server_name VARCHAR(100) NOT NULL,
  active_users INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unknown',
  recorded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_app_support_terminal_history_terminal_code_recorded_at
ON app_support_terminal_history (terminal_code, recorded_at);

CREATE INDEX IF NOT EXISTS idx_app_support_terminal_history_recorded_at
ON app_support_terminal_history (recorded_at);

-- Clean up old data (keep last 7 days)
DELETE FROM app_support_terminal_history
WHERE recorded_at < NOW() - INTERVAL '7 days';