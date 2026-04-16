const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
  ensurePrinterMonitorTables,
  cleanupOldPrinterLogs,
  runPrinterMonitorCycle,
} = require('../services/printerMonitor');

function composeLocation(bay, stage, wc) {
  return [bay, stage, wc].filter(Boolean).join(' / ') || '-';
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM printers ORDER BY pmno');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/dashboard-live/refresh', async (req, res) => {
  try {
    await ensurePrinterMonitorTables();
    await runPrinterMonitorCycle();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/dashboard-live', async (req, res) => {
  try {
    await ensurePrinterMonitorTables();
    await cleanupOldPrinterLogs();

    const [{ rows: printers }, { rows: liveRows }, { rows: vlanRows }, { rows: latestHealthRows }] = await Promise.all([
      pool.query('SELECT * FROM printers ORDER BY pmno'),
      pool.query('SELECT * FROM printer_live_state'),
      pool.query('SELECT ip, bay, stage, wc, loc FROM vlan'),
      pool.query(`
        SELECT DISTINCT ON (pmno)
          pmno, firmware, km, loc, stage, bay, wc, checked_at
        FROM health_checkups
        WHERE pmno IS NOT NULL
        ORDER BY pmno, checked_at DESC
      `),
    ]);

    const liveByPm = new Map(liveRows.map((l) => [String(l.pmno || '').toUpperCase(), l]));
    const vlanByIp = new Map(vlanRows.map((v) => [String(v.ip || '').trim(), v]));
    const healthByPm = new Map(latestHealthRows.map((h) => [String(h.pmno || '').toUpperCase(), h]));

    const out = printers.map((p) => {
      const pmno = String(p.pmno || '').toUpperCase();
      const live = liveByPm.get(pmno);
      const health = healthByPm.get(pmno);
      const ip = live?.ip || null;
      const vlan = ip ? vlanByIp.get(String(ip).trim()) : null;

      const resolved_bay = live?.resolved_bay || vlan?.bay || health?.bay || p.bay || null;
      const resolved_stage = live?.resolved_stage || vlan?.stage || health?.stage || p.stage || null;
      const resolved_wc = live?.resolved_wc || vlan?.wc || health?.wc || p.wc || null;

      return {
        ...p,
        ip,
        online_status: live?.online_status || 'offline',
        condition_status: live?.condition_status || (String(p.status || '').toLowerCase() === 'error' ? 'error' : 'ready'),
        error_reason: live?.error_reason || null,
        firmware_version: live?.firmware_version || health?.firmware || p.firmware || null,
        printer_km: live?.printer_km || health?.km || null,
        resolved_bay,
        resolved_stage,
        resolved_wc,
        location_display: live?.location_display || composeLocation(resolved_bay, resolved_stage, resolved_wc),
        monitored_at: live?.updated_at || null,
      };
    });

    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/status-logs/:pmno', async (req, res) => {
  try {
    await ensurePrinterMonitorTables();
    await cleanupOldPrinterLogs();

    const pmno = String(req.params.pmno || '').toUpperCase();
    const { rows } = await pool.query(
      `SELECT id, pmno, serial, event_type, reason, old_online_status, new_online_status,
              old_condition_status, new_condition_status, old_error_reason, new_error_reason,
              old_ip, new_ip, logged_at
       FROM printer_status_logs
       WHERE pmno = $1 AND logged_at >= NOW() - INTERVAL '1 month'
       ORDER BY logged_at DESC`,
      [pmno]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:pmno', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM printers WHERE pmno=$1', [req.params.pmno.toUpperCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { pmno, serial, make, model, dpi, ip, wc, loc, stage, bay, status, pmdate, sapno, mesno, firmware, loftware, buyoff, remarks } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO printers (pmno,serial,make,model,dpi,ip,wc,loc,stage,bay,status,pmdate,sapno,mesno,firmware,loftware,buyoff,remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [pmno?.toUpperCase(), serial, make, model, dpi, ip, wc, loc, stage, bay, status || 'ready', pmdate, sapno, mesno, firmware, loftware, buyoff, remarks]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'PM No already exists. You can add one PM No only once.' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const { serial, make, model, dpi, ip, wc, loc, stage, bay, status, pmdate, sapno, mesno, firmware, loftware, buyoff, remarks } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE printers SET serial=$1,make=$2,model=$3,dpi=$4,ip=$5,wc=$6,loc=$7,stage=$8,bay=$9,status=$10,pmdate=$11,
       sapno=$12,mesno=$13,firmware=$14,loftware=$15,buyoff=$16,remarks=$17,updated_at=NOW() WHERE id=$18 RETURNING *`,
      [serial, make, model, dpi, ip, wc, loc, stage, bay, status, pmdate, sapno, mesno, firmware, loftware, buyoff, remarks, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM printers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
