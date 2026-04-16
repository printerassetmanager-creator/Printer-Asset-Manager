const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { plants } = req.query;
    let query = 'SELECT * FROM vlan';
    const params = [];

    if (plants) {
      const plantList = plants.split(',').map((p) => p.trim());
      query += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }

    query += ' ORDER BY port';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/by-ip/:ip', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vlan WHERE ip=$1', [req.params.ip]);
    res.json(rows[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { port, ip, mac, sw, loc, stage, bay, wc, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO vlan (port,ip,mac,sw,loc,stage,bay,wc,plant_location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [port, ip, mac, sw, loc, stage, bay, wc, plant_location || 'B26']
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { port, ip, mac, sw, loc, stage, bay, wc, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE vlan SET port=$1,ip=$2,mac=$3,sw=$4,loc=$5,stage=$6,bay=$7,wc=$8,plant_location=$9 WHERE id=$10 RETURNING *`,
      [port, ip, mac, sw, loc, stage, bay, wc, plant_location || 'B26', req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vlan WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
