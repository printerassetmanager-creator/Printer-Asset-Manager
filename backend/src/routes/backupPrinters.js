const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { getPrinterSnapshotByPmno } = require('../services/printerLocationSync');

async function ensureBackupPrintersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS backup_printers (
      id SERIAL PRIMARY KEY,
      pmno VARCHAR(20) UNIQUE NOT NULL,
      serial VARCHAR(50) NOT NULL,
      make VARCHAR(50) NOT NULL,
      dpi VARCHAR(10) NOT NULL,
      plant_location VARCHAR(50) DEFAULT 'B26',
      storage_location TEXT NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_backup_printers_plant_dpi
    ON backup_printers (plant_location, dpi)
  `);
}

router.get('/', async (req, res) => {
  try {
    await ensureBackupPrintersTable();

    const { plants } = req.query;
    let query = 'SELECT * FROM backup_printers';
    const params = [];

    if (plants) {
      const plantList = plants.split(',').map((plant) => plant.trim());
      query += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }

    query += ' ORDER BY pmno';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/match-for-issue/:pmno', async (req, res) => {
  try {
    await ensureBackupPrintersTable();

    const pmno = String(req.params.pmno || '').trim().toUpperCase();
    const { rows: printers } = await pool.query(
      'SELECT pmno, serial, dpi, plant_location FROM printers WHERE pmno = $1',
      [pmno]
    );

    if (!printers.length) {
      return res.json({ sourcePrinter: null, matches: [] });
    }

    const sourcePrinter = printers[0];
    const { rows: matches } = await pool.query(
      `SELECT *
       FROM backup_printers
       WHERE dpi = $1
         AND plant_location = $2
         AND pmno <> $3
       ORDER BY pmno`,
      [sourcePrinter.dpi || '', sourcePrinter.plant_location || 'B26', sourcePrinter.pmno]
    );

    res.json({ sourcePrinter, matches });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { pmno, storage_location, remarks } = req.body;

  if (!pmno || !storage_location) {
    return res.status(400).json({ error: 'PM No and Storage Location are required' });
  }

  try {
    await ensureBackupPrintersTable();
    const printer = await getPrinterSnapshotByPmno(pmno);
    if (!printer) {
      return res.status(400).json({ error: 'PM No not found in printer master. Add the printer first.' });
    }
    if (!printer.serial || !printer.make || !printer.dpi || !printer.plant_location) {
      return res.status(400).json({ error: 'Selected PM No is missing serial, make, DPI, or plant location in printer master.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO backup_printers (pmno, serial, make, dpi, plant_location, storage_location, remarks, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       RETURNING *`,
      [
        printer.pmno,
        printer.serial || '',
        printer.make || '',
        printer.dpi || '',
        printer.plant_location || 'B26',
        String(storage_location).trim(),
        remarks || '',
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Backup printer PM No already exists.' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { pmno, storage_location, remarks } = req.body;

  if (!pmno || !storage_location) {
    return res.status(400).json({ error: 'PM No and Storage Location are required' });
  }

  try {
    await ensureBackupPrintersTable();
    const printer = await getPrinterSnapshotByPmno(pmno);
    if (!printer) {
      return res.status(400).json({ error: 'PM No not found in printer master. Add the printer first.' });
    }
    if (!printer.serial || !printer.make || !printer.dpi || !printer.plant_location) {
      return res.status(400).json({ error: 'Selected PM No is missing serial, make, DPI, or plant location in printer master.' });
    }

    const { rows } = await pool.query(
      `UPDATE backup_printers
       SET pmno=$1, serial=$2, make=$3, dpi=$4, plant_location=$5, storage_location=$6, remarks=$7, updated_at=NOW()
       WHERE id=$8
       RETURNING *`,
      [
        printer.pmno,
        printer.serial || '',
        printer.make || '',
        printer.dpi || '',
        printer.plant_location || 'B26',
        String(storage_location).trim(),
        remarks || '',
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Backup printer PM No already exists.' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureBackupPrintersTable();
    await pool.query('DELETE FROM backup_printers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
