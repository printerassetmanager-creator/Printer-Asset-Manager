const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recipes ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name,make,model,dpi,media,width,length,top,left_margin,darkness,speed,loft,verifier,calibration,contrast,size,desc } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO recipes (name,make,model,dpi,media,width,length,top,left_margin,darkness,speed,loft,verifier,calibration,contrast,size,"desc")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name,make,model,dpi,media,width,length,top,left_margin,darkness,speed,loft,verifier,calibration,contrast,size,desc]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { name,make,model,dpi,media,width,length,top,left_margin,darkness,speed,loft,verifier,calibration,contrast,size,desc } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE recipes SET name=$1,make=$2,model=$3,dpi=$4,media=$5,width=$6,length=$7,top=$8,left_margin=$9,
       darkness=$10,speed=$11,loft=$12,verifier=$13,calibration=$14,contrast=$15,size=$16,"desc"=$17,updated_at=NOW() WHERE id=$18 RETURNING *`,
      [name,make,model,dpi,media,width,length,top,left_margin,darkness,speed,loft,verifier,calibration,contrast,size,desc,req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM recipes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
