const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { adminMiddleware } = require('../middleware/auth');

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

router.get('/requirements', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT hc.pmno,
             hc.loc,
             hc.make,
             dp->>'name' as name,
             dp->>'qty' as qty,
             hc.model,
             hc.engineer,
             hc.checked_at
      FROM health_checkups hc,
           jsonb_array_elements(hc.damaged_parts) dp
      WHERE hc.health = 'nok'
      ORDER BY hc.checked_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { code, name, compat, loc, serial, condition, plant_location, printer_model, category } = req.body;
  const quantity = 1;
  const plant = plant_location || 'B26';
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    if (code) {
      const result = await client.query(
        `UPDATE spare_parts SET
           avail = avail + $1,
           name = $2,
           compat = $3,
           loc = $4,
           serial = $5,
           condition = $6,
           plant_location = $7,
           printer_model = COALESCE(NULLIF($9, ''), printer_model),
           category = COALESCE(NULLIF($10, ''), category),
           updated_at = NOW()
         WHERE code = $8
         RETURNING *`,
        [quantity, name, compat, loc, serial, condition || 'New', plant, code, printer_model, category]
      );

      if (result.rows.length) {
        await client.query('COMMIT');
        return res.status(201).json(result.rows[0]);
      }
    }

    const matchResult = await client.query(
      `SELECT * FROM spare_parts
       WHERE lower(name) = lower($1)
         AND lower(coalesce(printer_model, '')) = lower(coalesce($2, ''))
         AND lower(coalesce(compat, '')) = lower(coalesce($3, ''))
         AND plant_location = $4
       LIMIT 1`,
      [name, printer_model || '', compat || '', plant]
    );

    if (matchResult.rows.length) {
      const existing = matchResult.rows[0];
      const updated = await client.query(
        `UPDATE spare_parts SET
           avail = avail + $1,
           loc = $2,
           serial = $3,
           condition = $4,
           category = COALESCE(NULLIF($5, ''), category),
           updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [quantity, loc, serial, condition || 'New', category, existing.id]
      );
      await client.query('COMMIT');
      return res.status(201).json(updated.rows[0]);
    }

    const insertResult = await client.query(
      `INSERT INTO spare_parts (code,name,compat,avail,loc,serial,condition,plant_location,printer_model,category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [code, name, compat, quantity, loc, serial, condition || 'New', plant, printer_model, category]
    );

    await client.query('COMMIT');
    res.status(201).json(insertResult.rows[0]);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    if (client) client.release();
  }
});

router.post('/use', adminMiddleware, async (req, res) => {
  const { code, name, model, printer_model, qty, pmno, serial, wc, used_by } = req.body;
  if ((!code && !name) || !pmno) {
    return res.status(400).json({ error: 'Part code or part name plus PM number are required' });
  }
  const quantity = parseInt(qty, 10) || 1;
  const targetModel = printer_model || model || '';
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO parts_usage_log (code,name,qty,pmno,serial,wc,used_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [code, name, quantity, pmno, serial, wc, used_by]
    );

    let result = null;
    if (code) {
      result = await client.query(
        `UPDATE spare_parts SET avail=GREATEST(0,avail-$1),updated_at=NOW() WHERE code=$2 RETURNING *`,
        [quantity, code]
      );
    }

    if ((!result || result.rowCount === 0) && name) {
      result = await client.query(
        `UPDATE spare_parts SET avail=GREATEST(0,avail-$1),updated_at=NOW()
         WHERE lower(name)=lower($2)
           AND lower(coalesce(printer_model,''))=lower(coalesce($3,''))
         RETURNING *`,
        [quantity, name, targetModel]
      );
    }

    if (!result || result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Part not found to deduct stock' });
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { code, name, compat, loc, serial, condition, printer_model, category } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE spare_parts SET code=$1,name=$2,compat=$3,loc=$4,serial=$5,condition=$6,printer_model=$7,category=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [code, name, compat, loc, serial, condition, printer_model, category, req.params.id]
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
