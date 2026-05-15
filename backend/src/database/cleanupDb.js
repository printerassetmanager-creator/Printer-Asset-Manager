const pool = require('../db/pool');

class CleanupDatabaseService {
  constructor() {
    this.pool = pool;
    this.enabled = process.env.ENABLE_CLEANUP_DB_LOGS === 'true';
  }

  async initializeTables() {
    if (!this.enabled) {
      console.warn('CleanupDatabaseService is disabled. Skipping cleanup-related table creation.');
      return;
    }

    await this.createServersTable();
    await this.createCleanupLogsTable();
    await this.createCleanupHistoryTable();
    await this.createSchedulesTable();
    await this.createActiveSessionsTable();
    await this.createCredentialsTable();
  }

  async createServersTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cleanup_servers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        hostname VARCHAR(255),
        ip_address INET,
        is_active BOOLEAN DEFAULT TRUE,
        last_cleanup TIMESTAMP,
        next_scheduled_cleanup TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cleanup_servers_active ON cleanup_servers(is_active)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cleanup_servers_next_cleanup ON cleanup_servers(next_scheduled_cleanup)
    `);
  }

  async createCleanupLogsTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cleanup_logs (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES cleanup_servers(id) ON DELETE CASCADE,
        server_name VARCHAR(100) NOT NULL,
        job_id VARCHAR(255),
        status VARCHAR(20) NOT NULL, -- 'running', 'success', 'failed'
        profiles_scanned INTEGER DEFAULT 0,
        profiles_deleted TEXT[] DEFAULT ARRAY[]::TEXT[],
        profiles_failed TEXT[] DEFAULT ARRAY[]::TEXT[],
        space_freed_bytes BIGINT DEFAULT 0,
        execution_time_seconds DECIMAL(10,2) DEFAULT 0,
        triggered_by VARCHAR(255),
        error_message TEXT,
        dry_run BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cleanup_logs_server ON cleanup_logs(server_name)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cleanup_logs_status ON cleanup_logs(status)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cleanup_logs_created ON cleanup_logs(created_at DESC)
    `);
  }

  async createCleanupHistoryTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cleanup_history (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES cleanup_servers(id) ON DELETE CASCADE,
        cleanup_log_id INTEGER REFERENCES cleanup_logs(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL, -- 'profile_deleted', 'profile_failed', 'error'
        profile_name VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async createSchedulesTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cleanup_schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cron_expression VARCHAR(50) NOT NULL,
        server_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        is_active BOOLEAN DEFAULT TRUE,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async createActiveSessionsTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES cleanup_servers(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        session_id VARCHAR(50),
        login_time TIMESTAMP,
        last_activity TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_active_sessions_server ON active_sessions(server_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON active_sessions(is_active)
    `);
  }

  async createCredentialsTable() {
    if (!this.enabled) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS server_credentials (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES cleanup_servers(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        encrypted_password TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_used TIMESTAMP,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(server_id, username)
      )
    `);
  }

  // Server management methods
  async addServer(serverData) {
    if (!this.enabled) return null;

    const { name, hostname, ip_address } = serverData;
    const result = await this.pool.query(`
      INSERT INTO cleanup_servers (name, hostname, ip_address)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET
        hostname = EXCLUDED.hostname,
        ip_address = EXCLUDED.ip_address,
        updated_at = NOW()
      RETURNING *
    `, [name, hostname, ip_address]);
    return result.rows[0];
  }

  async getServers(activeOnly = true) {
    if (!this.enabled) return [];

    const query = activeOnly
      ? 'SELECT * FROM cleanup_servers WHERE is_active = true ORDER BY name'
      : 'SELECT * FROM cleanup_servers ORDER BY name';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateServerLastCleanup(serverName) {
    if (!this.enabled) return;

    await this.pool.query(`
      UPDATE cleanup_servers
      SET last_cleanup = NOW(), updated_at = NOW()
      WHERE name = $1
    `, [serverName]);
  }

  // Cleanup log methods
  async saveCleanupLog(logData) {
    if (!this.enabled) {
      console.warn('Cleanup log saving is disabled. Skipping database write.');
      return null;
    }

    const {
      server_name,
      job_id,
      status,
      profiles_scanned = 0,
      profiles_deleted = [],
      profiles_failed = [],
      space_freed_bytes = 0,
      execution_time_seconds = 0,
      triggered_by,
      error_message,
      dry_run = false,
      started_at,
      completed_at
    } = logData;

    const result = await this.pool.query(`
      INSERT INTO cleanup_logs (
        server_name, job_id, status, profiles_scanned, profiles_deleted,
        profiles_failed, space_freed_bytes, execution_time_seconds,
        triggered_by, error_message, dry_run, started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      server_name, job_id, status, profiles_scanned, profiles_deleted,
      profiles_failed, space_freed_bytes, execution_time_seconds,
      triggered_by, error_message, dry_run, started_at, completed_at
    ]);

    // Update server's last cleanup time
    if (status === 'success') {
      await this.updateServerLastCleanup(server_name);
    }

    return result.rows[0];
  }

  async getCleanupLogs(serverName = null, limit = 50) {
    if (!this.enabled) return [];

    let query = `
      SELECT cl.*, cs.hostname, cs.ip_address
      FROM cleanup_logs cl
      LEFT JOIN cleanup_servers cs ON cl.server_name = cs.name
    `;
    const params = [];

    if (serverName) {
      query += ' WHERE cl.server_name = $1';
      params.push(serverName);
    }

    query += ' ORDER BY cl.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getCleanupStatus() {
    if (!this.enabled) return null;

    const result = await this.pool.query(`
      SELECT * FROM cleanup_logs
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return result.rows[0] || null;
  }

  // Active sessions methods
  async saveActiveSession(sessionData) {
    const { server_id, username, session_id, login_time } = sessionData;
    const result = await this.pool.query(`
      INSERT INTO active_sessions (server_id, username, session_id, login_time)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (server_id, username) DO UPDATE SET
        session_id = EXCLUDED.session_id,
        login_time = EXCLUDED.login_time,
        last_activity = NOW()
      RETURNING *
    `, [server_id, username, session_id, login_time]);
    return result.rows[0];
  }

  async getActiveSessions(serverId = null) {
    if (!this.enabled) return [];

    let query = 'SELECT * FROM active_sessions WHERE is_active = true';
    const params = [];

    if (serverId) {
      query += ' AND server_id = $1';
      params.push(serverId);
    }

    query += ' ORDER BY last_activity DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async clearInactiveSessions(olderThanMinutes = 30) {
    if (!this.enabled) return;

    await this.pool.query(`
      UPDATE active_sessions
      SET is_active = false
      WHERE last_activity < NOW() - INTERVAL '${olderThanMinutes} minutes'
    `);
  }

  // Credential management (encrypted)
  async saveServerCredentials(credentialData) {
    if (!this.enabled) return null;

    const { server_id, username, encrypted_password, created_by } = credentialData;
    const result = await this.pool.query(`
      INSERT INTO server_credentials (server_id, username, encrypted_password, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (server_id, username) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        last_used = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [server_id, username, encrypted_password, created_by]);
    return result.rows[0];
  }

  async getServerCredentials(serverId) {
    if (!this.enabled) return [];

    const result = await this.pool.query(`
      SELECT * FROM server_credentials
      WHERE server_id = $1 AND is_active = true
      ORDER BY last_used DESC NULLS LAST, created_at DESC
    `, [serverId]);
    return result.rows;
  }

  // Analytics methods
  async getCleanupAnalytics(days = 30) {
    if (!this.enabled) return {
      total_cleanups: 0,
      successful_cleanups: 0,
      failed_cleanups: 0,
      total_profiles_scanned: 0,
      total_profiles_deleted: 0,
      total_space_freed: 0,
      avg_execution_time: 0
    };

    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total_cleanups,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_cleanups,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_cleanups,
        SUM(profiles_scanned) as total_profiles_scanned,
        SUM(array_length(profiles_deleted, 1)) as total_profiles_deleted,
        SUM(space_freed_bytes) as total_space_freed,
        AVG(execution_time_seconds) as avg_execution_time
      FROM cleanup_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);
    return result.rows[0];
  }

  async getServerCleanupStats() {
    if (!this.enabled) return [];

    const result = await this.pool.query(`
      SELECT
        server_name,
        COUNT(*) as cleanup_count,
        MAX(created_at) as last_cleanup,
        SUM(array_length(profiles_deleted, 1)) as total_profiles_deleted,
        SUM(space_freed_bytes) as total_space_freed
      FROM cleanup_logs
      WHERE status = 'success'
      GROUP BY server_name
      ORDER BY last_cleanup DESC
    `);
    return result.rows;
  }
}

module.exports = CleanupDatabaseService;