const pool = require('../db/pool');

function cleanValue(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizePmno(value) {
  const cleaned = cleanValue(value);
  return cleaned ? cleaned.toUpperCase() : null;
}

function composeLocation(parts = {}) {
  const explicitLocation = cleanValue(parts.loc);
  if (explicitLocation) return explicitLocation;

  const combined = [cleanValue(parts.wc), cleanValue(parts.bay), cleanValue(parts.stage)]
    .filter(Boolean)
    .join(' / ');

  return combined || null;
}

function parseTimestamp(value) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function sameValue(a, b) {
  return cleanValue(a) === cleanValue(b);
}

async function ensurePrinterLocationLogsTable(db = pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS printer_location_logs (
      id SERIAL PRIMARY KEY,
      pmno VARCHAR(20) NOT NULL,
      serial VARCHAR(50),
      old_wc VARCHAR(30),
      old_stage VARCHAR(30),
      old_bay VARCHAR(30),
      old_loc TEXT,
      old_plant_location VARCHAR(50),
      new_wc VARCHAR(30),
      new_stage VARCHAR(30),
      new_bay VARCHAR(30),
      new_loc TEXT,
      new_plant_location VARCHAR(50),
      source VARCHAR(30) NOT NULL,
      changed_by VARCHAR(100),
      changed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_printer_location_logs_pmno_time
    ON printer_location_logs (pmno, changed_at DESC)
  `);
}

async function getPrinterSnapshotByPmno(pmno, db = pool) {
  const normalizedPmno = normalizePmno(pmno);
  if (!normalizedPmno) return null;

  const { rows } = await db.query(
    `SELECT id, pmno, serial, make, model, dpi, ip, wc, loc, stage, bay,
            sapno, mesno, firmware, loftware, plant_location
     FROM printers
     WHERE pmno = $1`,
    [normalizedPmno]
  );

  return rows[0] || null;
}

async function syncPrinterMasterFromEvent({
  db = pool,
  pmno,
  serial,
  make,
  model,
  dpi,
  ip,
  wc,
  loc,
  stage,
  bay,
  sapno,
  mesno,
  firmware,
  loftware,
  plant_location,
  source = 'manual',
  changed_by,
  changed_at,
}) {
  const normalizedPmno = normalizePmno(pmno);
  if (!normalizedPmno) {
    return { updated: false, locationChanged: false, reason: 'missing_pmno' };
  }

  await ensurePrinterLocationLogsTable(db);

  const { rows } = await db.query(
    `SELECT id, pmno, serial, make, model, dpi, ip, wc, loc, stage, bay,
            sapno, mesno, firmware, loftware, plant_location
     FROM printers
     WHERE pmno = $1
     FOR UPDATE`,
    [normalizedPmno]
  );

  if (!rows.length) {
    return { updated: false, locationChanged: false, reason: 'printer_not_found' };
  }

  const current = rows[0];
  const next = {
    serial: cleanValue(serial) || current.serial,
    make: cleanValue(make) || current.make,
    model: cleanValue(model) || current.model,
    dpi: cleanValue(dpi) || current.dpi,
    ip: cleanValue(ip) || current.ip,
    wc: cleanValue(wc) || current.wc,
    stage: cleanValue(stage) || current.stage,
    bay: cleanValue(bay) || current.bay,
    loc: composeLocation({
      wc: cleanValue(wc) || current.wc,
      bay: cleanValue(bay) || current.bay,
      stage: cleanValue(stage) || current.stage,
      loc,
    }) || current.loc,
    sapno: cleanValue(sapno) || current.sapno,
    mesno: cleanValue(mesno) || current.mesno,
    firmware: cleanValue(firmware) || current.firmware,
    loftware: cleanValue(loftware) || current.loftware,
    plant_location: cleanValue(plant_location) || current.plant_location,
  };

  const locationChanged =
    !sameValue(current.wc, next.wc) ||
    !sameValue(current.stage, next.stage) ||
    !sameValue(current.bay, next.bay) ||
    !sameValue(current.loc, next.loc) ||
    !sameValue(current.plant_location, next.plant_location);

  const printerChanged =
    locationChanged ||
    !sameValue(current.serial, next.serial) ||
    !sameValue(current.make, next.make) ||
    !sameValue(current.model, next.model) ||
    !sameValue(current.dpi, next.dpi) ||
    !sameValue(current.ip, next.ip) ||
    !sameValue(current.sapno, next.sapno) ||
    !sameValue(current.mesno, next.mesno) ||
    !sameValue(current.firmware, next.firmware) ||
    !sameValue(current.loftware, next.loftware);

  if (!printerChanged) {
    return { updated: false, locationChanged: false, printer: current };
  }

  const { rows: updatedRows } = await db.query(
    `UPDATE printers
     SET serial = $1,
         make = $2,
         model = $3,
         dpi = $4,
         ip = $5,
         wc = $6,
         loc = $7,
         stage = $8,
         bay = $9,
         sapno = $10,
         mesno = $11,
         firmware = $12,
         loftware = $13,
         plant_location = $14,
         updated_at = NOW()
     WHERE id = $15
     RETURNING *`,
    [
      next.serial,
      next.make,
      next.model,
      next.dpi,
      next.ip,
      next.wc,
      next.loc,
      next.stage,
      next.bay,
      next.sapno,
      next.mesno,
      next.firmware,
      next.loftware,
      next.plant_location,
      current.id,
    ]
  );

  if (locationChanged) {
    await db.query(
      `INSERT INTO printer_location_logs (
        pmno, serial, old_wc, old_stage, old_bay, old_loc, old_plant_location,
        new_wc, new_stage, new_bay, new_loc, new_plant_location,
        source, changed_by, changed_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        normalizedPmno,
        next.serial || current.serial,
        current.wc,
        current.stage,
        current.bay,
        current.loc,
        current.plant_location,
        next.wc,
        next.stage,
        next.bay,
        next.loc,
        next.plant_location,
        source,
        cleanValue(changed_by) || 'Unknown',
        parseTimestamp(changed_at),
      ]
    );
  }

  return {
    updated: true,
    locationChanged,
    printer: updatedRows[0],
  };
}

module.exports = {
  composeLocation,
  ensurePrinterLocationLogsTable,
  getPrinterSnapshotByPmno,
  normalizePmno,
  syncPrinterMasterFromEvent,
};
