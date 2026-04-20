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
  
  // Validate that DN is provided and model is provided
  if (!dn || !dn.trim()) {
    return res.status(400).json({ error: 'DN (Distributor Number) is required for each cartridge' });
  }
  if (!model || !model.trim()) {
    return res.status(400).json({ error: 'Model is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO cartridges (model,dn,type,compat,stock,min,yield,loc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [model.trim(), dn.trim(), type, compat, stock||0, min||2, yld, loc]
    );
    res.status(201).json(rows[0]);
  } catch (e) { 
    // Handle unique constraint violations
    if (e.constraint === 'cartridges_dn_unique' || e.message.includes('duplicate key')) {
      return res.status(400).json({ error: `Cartridge with DN "${dn}" already exists` });
    }
    if (e.constraint === 'cartridges_model_key' || e.message.includes('model')) {
      return res.status(400).json({ error: `Cartridge model "${model}" already exists` });
    }
    res.status(500).json({ error: e.message }); 
  }
});

router.post('/use', async (req, res) => {
  const { dn, model, qty, wc, ip, used_by, printer_location, printer_tag } = req.body;
  const client = await pool.connect();
  try {
    const normalizedQty = Math.max(1, parseInt(qty, 10) || 1);
    const trimmedDn = String(dn || '').trim();
    const trimmedModel = String(model || '').trim();
    const trimmedUser = String(used_by || '').trim();

    if (!trimmedDn && !trimmedModel) {
      return res.status(400).json({ error: 'DN No or cartridge model is required.' });
    }

    await client.query('BEGIN');
    const cartridgeQuery = await client.query(
      `SELECT *
       FROM cartridges
       WHERE ($1 <> '' AND dn = $1) OR ($2 <> '' AND model = $2)
       ORDER BY CASE WHEN $1 <> '' AND dn = $1 THEN 0 ELSE 1 END, id
       LIMIT 1`,
      [trimmedDn, trimmedModel]
    );
    const cartridge = cartridgeQuery.rows[0];

    if (!cartridge) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Matching cartridge not found in inventory.' });
    }

    if ((cartridge.stock || 0) < normalizedQty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${cartridge.stock || 0} cartridge(s) available in stock.` });
    }

    await client.query(
      `INSERT INTO cartridge_usage_log (dn,model,qty,wc,ip,printer_location,printer_tag,used_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [cartridge.dn, cartridge.model, normalizedQty, wc, ip, printer_location || null, printer_tag || null, trimmedUser || 'System']
    );

    const stockUpdate = await client.query(
      `UPDATE cartridges
       SET stock = stock - $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [normalizedQty, cartridge.id]
    );
    await client.query('COMMIT');
    res.json({ success: true, cartridge: stockUpdate.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

router.put('/:id', async (req, res) => {
  const { model, dn, type, compat, stock, min, yield: yld, loc } = req.body;
  
  // Validate required fields
  if (!dn || !dn.trim()) {
    return res.status(400).json({ error: 'DN (Distributor Number) is required' });
  }
  if (!model || !model.trim()) {
    return res.status(400).json({ error: 'Model is required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE cartridges SET model=$1,dn=$2,type=$3,compat=$4,stock=$5,min=$6,yield=$7,loc=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [model.trim(), dn.trim(), type, compat, stock, min, yld, loc, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cartridge not found' });
    }
    res.json(rows[0]);
  } catch (e) { 
    // Handle unique constraint violations
    if (e.constraint === 'cartridges_dn_unique' || e.message.includes('duplicate key')) {
      return res.status(400).json({ error: `DN "${dn}" is already assigned to another cartridge` });
    }
    if (e.constraint === 'cartridges_model_key' || e.message.includes('model')) {
      return res.status(400).json({ error: `Model "${model}" is already assigned to another cartridge` });
    }
    res.status(500).json({ error: e.message }); 
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cartridges WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
