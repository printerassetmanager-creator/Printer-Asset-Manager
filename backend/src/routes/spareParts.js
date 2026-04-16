const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { plants } = req.query;
    let query = 'SELECT * FROM spare_parts';
    const params = [];

    if (plants) {
      const plantList = plants.split(',').map((p) => p.trim());
      query += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }

    query += ' ORDER BY code';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/usage-log', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM parts_usage_log ORDER BY used_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { code, name, compat, avail, min, loc, serial, condition, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO spare_parts (code,name,compat,avail,min,loc,serial,condition,plant_location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code, name, compat, avail||0, min||2, loc, serial, condition||'New', plant_location || 'B26']
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/use', async (req, res) => {
  const { code, name, qty, pmno, serial, wc, used_by } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO parts_usage_log (code,name,qty,pmno,serial,wc,used_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [code, name, qty||1, pmno, serial, wc, used_by]
    );
    await client.query(`UPDATE spare_parts SET avail=GREATEST(0,avail-$1),updated_at=NOW() WHERE code=$2`, [qty||1, code]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

router.put('/:id', async (req, res) => {
  const { code, name, compat, avail, min, loc, serial, condition } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE spare_parts SET code=$1,name=$2,compat=$3,avail=$4,min=$5,loc=$6,serial=$7,condition=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [code, name, compat, avail, min, loc, serial, condition, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM spare_parts WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
