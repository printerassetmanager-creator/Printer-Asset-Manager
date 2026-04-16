const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    // Auto-delete issues older than 10 days
    await pool.query(`DELETE FROM issues WHERE expires_at < NOW()`);
    const { rows } = await pool.query('SELECT * FROM issues ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { pmno, serial, model, loc, title, desc, action, severity, category, reporter } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO issues (pmno,serial,model,loc,title,"desc",action,severity,category,reporter)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [pmno, serial, model, loc, title, desc, action, severity||'Medium', category||'Other', reporter]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { pmno, serial, model, loc, title, desc, action, severity, category, reporter } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE issues SET pmno=$1,serial=$2,model=$3,loc=$4,title=$5,"desc"=$6,action=$7,severity=$8,category=$9,reporter=$10 WHERE id=$11 RETURNING *`,
      [pmno, serial, model, loc, title, desc, action, severity, category, reporter, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/resolve', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE issues SET status='resolved', resolved_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM issues WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
