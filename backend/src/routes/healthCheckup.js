const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const ensureActivityLogTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_checkup_activity_log (
      id SERIAL PRIMARY KEY,
      pmno VARCHAR(20) NOT NULL,
      engineer VARCHAR(100),
      checked_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_health_checkup_activity_checked_at
    ON health_checkup_activity_log (checked_at DESC)
  `);
};

const cleanupOldActivityLogs = async (db = pool) => {
  await db.query(`DELETE FROM health_checkup_activity_log WHERE checked_at < NOW() - INTERVAL '1 month'`);
};

const activityLogInitPromise = ensureActivityLogTable().catch((e) => {
  console.error('Failed to initialize health_checkup_activity_log:', e.message);
});

setInterval(async () => {
  try {
    await activityLogInitPromise;
    await cleanupOldActivityLogs();
  } catch (e) {
    console.error('Failed to cleanup old health checkup activity logs:', e.message);
  }
}, 6 * 60 * 60 * 1000).unref();

router.get('/', async (req, res) => {
  try {
    await activityLogInitPromise;
    await cleanupOldActivityLogs();
    const { rows } = await pool.query('SELECT * FROM health_checkups ORDER BY checked_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/activity-log', async (req, res) => {
  try {
    await activityLogInitPromise;
    await cleanupOldActivityLogs();
    const { rows } = await pool.query(
      'SELECT id, pmno, engineer, checked_at FROM health_checkup_activity_log ORDER BY checked_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { pmno,serial,model,make,sapno,mesno,dpi,firmware,km,loftware,ip,mac,loc,stage,bay,wc,health,issue_desc,req_parts,damaged_parts,is_repeat,engineer } = req.body;
  const client = await pool.connect();
  try {
    await activityLogInitPromise;
    await client.query('BEGIN');
    await cleanupOldActivityLogs(client);

    const { rows } = await client.query(
      `INSERT INTO health_checkups (pmno,serial,model,make,sapno,mesno,dpi,firmware,km,loftware,ip,mac,loc,stage,bay,wc,health,issue_desc,req_parts,damaged_parts,is_repeat,engineer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [pmno,serial,model,make,sapno,mesno,dpi,firmware,km,loftware,ip,mac,loc,stage,bay,wc,health||'ok',issue_desc,req_parts,JSON.stringify(damaged_parts||[]),is_repeat||false,engineer]
    );

    const savedCheckup = rows[0];
    await client.query(
      `INSERT INTO health_checkup_activity_log (pmno, engineer, checked_at)
       VALUES ($1, $2, $3)`,
      [
        savedCheckup.pmno || (pmno || '').trim().toUpperCase(),
        savedCheckup.engineer || engineer || 'Unknown',
        savedCheckup.checked_at || new Date()
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(savedCheckup);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
