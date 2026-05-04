const { execFile } = require('child_process');
const pool = require('../db/pool');
const { sendApplicationSupportTerminalLoadAlert } = require('./emailService');

const DEFAULT_POLL_INTERVAL_MS = 60 * 1000;
const SERVER_USER_LIMIT = 30;
const TERMINAL_ALERT_THRESHOLD = 30;
const ALERT_HOURS = [6, 14, 18, 22];
const ALERT_TIME_ZONE = process.env.APP_SUPPORT_ALERT_TIME_ZONE || 'Asia/Kolkata';

const terminalDefaults = [
  { code: 'P01', name: 'P01', servers: [...rangeServers('INRJNM0RDSHP', 1, 20), ...rangeServers('INRJNM0RDSHP', 51, 54)] },
  { code: 'VAO01', name: 'VAO01', servers: rangeServers('INRJNM0RDSHVA', 11, 30) },
  { code: 'M01', name: 'M01', servers: rangeServers('INRJNM0RDSHM', 1, 6) },
  { code: 'D01', name: 'D01', servers: rangeServers('INRJNM0RDSHD', 1, 3) },
  { code: 'E01', name: 'E01', servers: rangeServers('INRJNM0RDSHE', 1, 6) },
];

let monitorTimer = null;
let monitorRunning = false;
let alertTimer = null;
let lastTerminalLoadAlertKey = null;

function rangeServers(prefix, start, end) {
  const width = start >= 10 || end >= 10 ? 2 : 2;
  const servers = [];
  for (let value = start; value <= end; value += 1) {
    servers.push(`${prefix}${String(value).padStart(width, '0')}`);
  }
  return servers;
}

async function ensureApplicationSupportTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_terminals (
      id SERIAL PRIMARY KEY,
      code VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_servers (
      id SERIAL PRIMARY KEY,
      terminal_id INTEGER REFERENCES app_support_terminals(id) ON DELETE CASCADE,
      name VARCHAR(100) UNIQUE NOT NULL,
      active_users INTEGER DEFAULT 0,
      max_users INTEGER DEFAULT ${SERVER_USER_LIMIT},
      status VARCHAR(20) DEFAULT 'unknown',
      last_checked_at TIMESTAMP,
      last_error TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function seedApplicationSupportDefaults() {
  await ensureApplicationSupportTables();

  for (const terminal of terminalDefaults) {
    const terminalResult = await pool.query(
      `INSERT INTO app_support_terminals (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [terminal.code, terminal.name, `${terminal.name} terminal group`]
    );

    const terminalId = terminalResult.rows[0].id;
    for (const serverName of terminal.servers) {
      await pool.query(
        `INSERT INTO app_support_servers (terminal_id, name, max_users)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [terminalId, serverName, SERVER_USER_LIMIT]
      );
    }
  }
}

function parseActiveUsers(output) {
  if (!output) return 0;

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^USERNAME\s+/i.test(line))
    .filter((line) => /\bActive\b/i.test(line))
    .length;
}

function queryServerActiveUsers(serverName) {
  return new Promise((resolve) => {
    execFile('quser', [`/server:${serverName}`], { timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (!error) {
        resolve({
          activeUsers: parseActiveUsers(stdout),
          status: 'online',
          error: null,
        });
        return;
      }

      execFile('query', ['user', `/server:${serverName}`], { timeout: 15000, windowsHide: true }, (fallbackError, fallbackStdout, fallbackStderr) => {
        if (!fallbackError) {
          resolve({
            activeUsers: parseActiveUsers(fallbackStdout),
            status: 'online',
            error: null,
          });
          return;
        }

        resolve({
          activeUsers: 0,
          status: 'unreachable',
          error: (fallbackStderr || stderr || fallbackError.message || error.message || 'Failed to query server').trim(),
        });
      });
    });
  });
}

async function pollApplicationSupportServers() {
  if (monitorRunning) return;
  monitorRunning = true;

  try {
    await ensureApplicationSupportTables();
    const result = await pool.query(
      `SELECT s.id, s.name, t.code as terminal_code
       FROM app_support_servers s
       JOIN app_support_terminals t ON s.terminal_id = t.id
       WHERE s.is_active = TRUE ORDER BY s.id`
    );

    for (const server of result.rows) {
      const status = await queryServerActiveUsers(server.name);
      await pool.query(
        `UPDATE app_support_servers
         SET active_users = $1,
             status = $2,
             last_error = $3,
             last_checked_at = NOW(),
             updated_at = NOW()
         WHERE id = $4`,
        [status.activeUsers, status.status, status.error, server.id]
      );

      // Insert historical data
      await pool.query(
        `INSERT INTO app_support_terminal_history (terminal_code, server_name, active_users, status, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [server.terminal_code, server.name, status.activeUsers, status.status]
      );
    }

    // Clean up old history data (keep last 7 days)
    await pool.query(
      `DELETE FROM app_support_terminal_history WHERE recorded_at < NOW() - INTERVAL '7 days'`
    );
  } catch (error) {
    console.error('[APP SUPPORT MONITOR] Poll failed:', error.message);
  } finally {
    monitorRunning = false;
  }
}

function formatAlertTime(date) {
  return date.toLocaleString('en-IN', {
    timeZone: ALERT_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

function getAlertDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ALERT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});
}

function getAlertKey(parts) {
  const year = parts.year;
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

async function getApplicationSupportEmails() {
  const result = await pool.query(
    `SELECT email
     FROM users
     WHERE status = 'active'
       AND (support_type = 'application' OR support_type = 'both' OR role = 'super_admin')
       AND email IS NOT NULL
     ORDER BY email`
  );

  return result.rows.map((row) => row.email).filter(Boolean);
}

async function getHotTerminalLoadDetails() {
  const result = await pool.query(
    `SELECT t.id AS terminal_id,
            t.code AS terminal_code,
            t.name AS terminal_name,
            s.name AS server_name,
            s.active_users,
            s.status
     FROM app_support_terminals t
     JOIN app_support_servers s ON s.terminal_id = t.id
     WHERE t.is_active = TRUE
       AND s.is_active = TRUE
     ORDER BY t.code, s.name`
  );

  const terminalsById = new Map();
  for (const row of result.rows) {
    if (!terminalsById.has(row.terminal_id)) {
      terminalsById.set(row.terminal_id, {
        code: row.terminal_code,
        name: row.terminal_name,
        total_users: 0,
        servers: [],
      });
    }

    const terminal = terminalsById.get(row.terminal_id);
    const activeUsers = Number(row.active_users || 0);
    terminal.total_users += activeUsers;
    terminal.servers.push({
      name: row.server_name,
      active_users: activeUsers,
      status: row.status || 'unknown',
    });
  }

  return Array.from(terminalsById.values())
    .filter((terminal) => terminal.total_users >= TERMINAL_ALERT_THRESHOLD)
    .map((terminal) => ({
      ...terminal,
      servers: terminal.servers.sort((a, b) => b.active_users - a.active_users || a.name.localeCompare(b.name)),
    }));
}

async function sendScheduledTerminalLoadAlert() {
  try {
    await ensureApplicationSupportTables();

    const hotTerminals = await getHotTerminalLoadDetails();
    if (hotTerminals.length === 0) {
      return;
    }

    const emails = await getApplicationSupportEmails();
    if (emails.length === 0) {
      console.warn('[APP SUPPORT ALERT] No active application support users found for terminal load alert');
      return;
    }

    const now = new Date();
    await sendApplicationSupportTerminalLoadAlert(emails, {
      alertTime: formatAlertTime(now),
      terminals: hotTerminals,
      totalUsers: hotTerminals.reduce((sum, terminal) => sum + terminal.total_users, 0),
    });
  } catch (error) {
    console.error('[APP SUPPORT ALERT] Terminal load alert failed:', error.message);
  }
}

function checkScheduledTerminalLoadAlert() {
  const now = new Date();
  const dateParts = getAlertDateParts(now);
  const isScheduledHour = ALERT_HOURS.includes(dateParts.hour);
  if (!isScheduledHour || dateParts.minute !== 0) {
    return;
  }

  const alertKey = getAlertKey(dateParts);
  if (lastTerminalLoadAlertKey === alertKey) {
    return;
  }

  lastTerminalLoadAlertKey = alertKey;
  sendScheduledTerminalLoadAlert();
}

function startTerminalLoadAlertScheduler() {
  if (alertTimer) return;
  checkScheduledTerminalLoadAlert();
  alertTimer = setInterval(checkScheduledTerminalLoadAlert, 30 * 1000);
}

async function startApplicationSupportMonitor() {
  await seedApplicationSupportDefaults();
  await pollApplicationSupportServers();

  if (monitorTimer) return;
  monitorTimer = setInterval(pollApplicationSupportServers, DEFAULT_POLL_INTERVAL_MS);
  startTerminalLoadAlertScheduler();
}

module.exports = {
  SERVER_USER_LIMIT,
  TERMINAL_ALERT_THRESHOLD,
  ensureApplicationSupportTables,
  seedApplicationSupportDefaults,
  startApplicationSupportMonitor,
  pollApplicationSupportServers,
  sendScheduledTerminalLoadAlert,
};
