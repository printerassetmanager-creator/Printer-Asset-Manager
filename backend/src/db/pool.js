const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.DB_SSL === 'true';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'printer_ms',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'yourpassword',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      // Connection pool settings
      max: 20, // maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Connection pool event handlers
pool.on('connect', () => {
  console.log('[DB] New connection established');
});

pool.on('error', (err, client) => {
  console.error('[DB] Unexpected error on idle client:', err);
  console.error('[DB] Client:', client);
});

pool.on('remove', () => {
  console.log('[DB] Client removed from pool');
});

// Test connection on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('[DB] Connection test failed:', err.message);
  } else {
    console.log('[DB] Connection successful at:', result.rows[0].now);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[DB] Closing connection pool...');
  await pool.end();
  process.exit(0);
});

module.exports = pool;
