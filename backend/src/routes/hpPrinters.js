const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hp_printers ORDER BY tag');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO hp_printers (tag,model,ip,loc,stage,bay,wc,cartmodel,black_pct,color_pct,online)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct||85, color_pct||null, online!==false]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE hp_printers SET tag=$1,model=$2,ip=$3,loc=$4,stage=$5,bay=$6,wc=$7,cartmodel=$8,black_pct=$9,color_pct=$10,online=$11 WHERE id=$12 RETURNING *`,
      [tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hp_printers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
