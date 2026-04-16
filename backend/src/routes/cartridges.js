const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cartridges ORDER BY model');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/usage-log', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cartridge_usage_log ORDER BY used_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { model, dn, type, compat, stock, min, yield: yld, loc } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO cartridges (model,dn,type,compat,stock,min,yield,loc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [model, dn, type, compat, stock||0, min||2, yld, loc]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/use', async (req, res) => {
  const { dn, model, qty, wc, ip, used_by } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO cartridge_usage_log (dn,model,qty,wc,ip,used_by) VALUES ($1,$2,$3,$4,$5,$6)`,
      [dn, model, qty||1, wc, ip, used_by]
    );
    await client.query(
      `UPDATE cartridges SET stock=GREATEST(0,stock-$1),updated_at=NOW() WHERE dn=$2 OR model=$3`,
      [qty||1, dn, model]
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

router.put('/:id', async (req, res) => {
  const { model, dn, type, compat, stock, min, yield: yld, loc } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE cartridges SET model=$1,dn=$2,type=$3,compat=$4,stock=$5,min=$6,yield=$7,loc=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [model, dn, type, compat, stock, min, yld, loc, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cartridges WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
