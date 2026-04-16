const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pm_pasted_log ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO pm_pasted_log (pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [pmno,serial,model,make,dpi,ip,firmware,sapno,mesno,loftware,pmdate,pasted_at,stage,bay,wc,loc,engineer,shift,remarks]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
