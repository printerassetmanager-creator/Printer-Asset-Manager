const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { syncPrinterMasterFromEvent } = require('../services/printerLocationSync');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pm_pasted_log ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO pm_pasted_log (pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks]
    );

    const savedLog = rows[0];
    await syncPrinterMasterFromEvent({
      db: client,
      pmno: savedLog.pmno || pmno,
      serial: savedLog.serial || serial,
      model: savedLog.model || model,
      make: savedLog.make || make,
      dpi: savedLog.dpi || dpi,
      ip: savedLog.ip || ip,
      wc: savedLog.wc || wc,
      loc: savedLog.loc || loc,
      stage: savedLog.stage || stage,
      bay: savedLog.bay || bay,
      sapno: savedLog.sapno || sapno,
      mesno: savedLog.mesno || mesno,
      firmware: savedLog.firmware || firmware,
      loftware: savedLog.loftware || loftware,
      source: 'pm_pasted',
      changed_by: savedLog.engineer || engineer || 'Unknown',
      changed_at: savedLog.created_at || pasted_at,
    });

    await client.query('COMMIT');
    res.status(201).json(savedLog);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
