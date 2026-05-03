const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { adminMiddleware } = require('../middleware/auth');

const cleanText = (value) => (typeof value === 'string' ? value.trim() : value);
const cleanOptionalText = (value) => cleanText(value) || null;

const ensureSparePartsSchema = async (db = pool) => {
  await db.query(`
    ALTER TABLE spare_parts
    ADD COLUMN IF NOT EXISTS serial VARCHAR(50),
    ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'New',
    ADD COLUMN IF NOT EXISTS plant_location VARCHAR(50) DEFAULT 'B26',
    ADD COLUMN IF NOT EXISTS printer_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS category VARCHAR(100)
  `);

  await db.query(`
    UPDATE spare_parts
    SET condition = COALESCE(condition, 'New'),
        plant_location = COALESCE(plant_location, 'B26')
    WHERE condition IS NULL
       OR plant_location IS NULL
  `);
};

const sparePartsSchemaReady = process.env.NODE_ENV === 'test'
  ? Promise.resolve()
  : ensureSparePartsSchema().catch((e) => {
      console.error('Failed to initialize spare_parts schema:', e.message);
    });

router.get('/', async (req, res) => {
  try {
    await sparePartsSchemaReady;
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
    await sparePartsSchemaReady;
    const { rows } = await pool.query(`
      SELECT id, code, name, qty, pmno, serial, wc, used_by, used_at
      FROM parts_usage_log
      ORDER BY used_at DESC, id DESC
      LIMIT 200
    `);
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
  const {
    code: rawCode,
    name: rawName,
    compat: rawCompat,
    loc: rawLoc,
    serial: rawSerial,
    condition: rawCondition,
    plant_location: rawPlantLocation,
    printer_model: rawPrinterModel,
    category: rawCategory
  } = req.body;
  const code = cleanText(rawCode);
  const name = cleanText(rawName);
  const compat = cleanText(rawCompat) || 'All';
  const loc = cleanOptionalText(rawLoc);
  const serial = cleanOptionalText(rawSerial);
  const condition = cleanText(rawCondition) || 'New';
  const plant = cleanText(rawPlantLocation) || 'B26';
  const printer_model = cleanOptionalText(rawPrinterModel);
  const category = cleanOptionalText(rawCategory);
  const quantity = 1;
  let client;

  if (!code || !name) {
    return res.status(400).json({ error: 'Part code and part name are required' });
  }

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await ensureSparePartsSchema(client);

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
    if (e.code === '23505') {
      return res.status(409).json({ error: 'A spare part with this code already exists' });
    }
    res.status(500).json({ error: e.message });
  } finally {
    if (client) client.release();
  }
});

router.post('/use', adminMiddleware, async (req, res) => {
  const {
    code: rawCode,
    name: rawName,
    model: rawModel,
    printer_model: rawPrinterModel,
    qty,
    pmno: rawPmno,
    serial: rawSerial,
    wc: rawWc,
    used_by: rawUsedBy
  } = req.body;
  const code = cleanOptionalText(rawCode);
  const name = cleanOptionalText(rawName);
  const model = cleanOptionalText(rawModel);
  const printer_model = cleanOptionalText(rawPrinterModel);
  const pmno = cleanText(rawPmno);
  const serial = cleanOptionalText(rawSerial);
  const wc = cleanOptionalText(rawWc);
  const used_by = cleanOptionalText(rawUsedBy);
  if ((!code && !name) || !pmno) {
    return res.status(400).json({ error: 'Part code or part name plus PM number are required' });
  }
  const quantity = parseInt(qty, 10) || 1;
  const targetModel = printer_model || model || '';
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureSparePartsSchema(client);
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
    await sparePartsSchemaReady;
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
