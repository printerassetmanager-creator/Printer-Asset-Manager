const pool = require('./src/db/pool');

const printerSeeds = [
  {
    pmno: '1256',
    serial: 'ZBR-1256-A',
    make: 'Zebra',
    model: 'ZT411',
    dpi: '203',
    ip: '10.132.10.21',
    wc: 'WC-B26-01',
    loc: 'B26 SMT Line 1',
    stage: 'SMT',
    bay: 'Bay 1',
    pmdate: '2026-05-15',
    sapno: 'SAP-1256',
    mesno: 'MES-1256',
    firmware: 'V80.20.17Z',
    loftware: 'Loftware-Primary',
    plant_location: 'B26',
  },
  {
    pmno: '1264',
    serial: 'HNY-1264-B',
    make: 'Honeywell',
    model: 'PM43',
    dpi: '300',
    ip: '10.132.10.22',
    wc: 'WC-B1600-02',
    loc: 'B1600 Packing Cell',
    stage: 'PACK',
    bay: 'Bay 2',
    pmdate: '2026-05-20',
    sapno: 'SAP-1264',
    mesno: 'MES-1264',
    firmware: 'R17.09.01',
    loftware: 'Loftware-Secondary',
    plant_location: 'B1600',
  },
  {
    pmno: '1272',
    serial: 'ZBR-1272-C',
    make: 'Zebra',
    model: 'ZT421',
    dpi: '203',
    ip: '10.132.10.23',
    wc: 'WC-B1700-03',
    loc: 'B1700 Final Test',
    stage: 'TEST',
    bay: 'Bay 3',
    pmdate: '2026-05-25',
    sapno: 'SAP-1272',
    mesno: 'MES-1272',
    firmware: 'V80.20.17Z',
    loftware: 'Loftware-Primary',
    plant_location: 'B1700',
  },
  {
    pmno: '1288',
    serial: 'HNY-1288-D',
    make: 'Honeywell',
    model: 'PX940',
    dpi: '300',
    ip: '10.132.10.24',
    wc: 'WC-B1800-04',
    loc: 'B1800 Shipping Area',
    stage: 'SHIP',
    bay: 'Bay 4',
    pmdate: '2026-05-30',
    sapno: 'SAP-1288',
    mesno: 'MES-1288',
    firmware: 'R18.02.04',
    loftware: 'Loftware-Primary',
    plant_location: 'B1800',
  },
];

const tableExists = async (table) => {
  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [table]
  );
  return rows[0]?.exists === true;
};

const technicalIp = (offset) => `10.132.10.${21 + offset}`;

const countRows = async (table) => {
  if (!(await tableExists(table))) return null;
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return rows[0].count;
};

const seedIfEmpty = async (table, seedFn) => {
  const count = await countRows(table);
  if (count === null) {
    console.log(`[skip] ${table} does not exist`);
    return;
  }

  if (count > 0) {
    console.log(`[skip] ${table} already has ${count} rows`);
    return;
  }

  await seedFn();
  console.log(`[ok] inserted 4 dummy rows into ${table}`);
};

const getReferencePrinters = async () => {
  let { rows } = await pool.query(
    `SELECT pmno, serial, make, model, dpi, ip, wc, loc, stage, bay, sapno, mesno, firmware, loftware, plant_location
     FROM printers
     ORDER BY pmno
     LIMIT 4`
  );

  if (rows.length >= 4) return rows;

  await seedPrinters();
  ({ rows } = await pool.query(
    `SELECT pmno, serial, make, model, dpi, ip, wc, loc, stage, bay, sapno, mesno, firmware, loftware, plant_location
     FROM printers
     ORDER BY pmno
     LIMIT 4`
  ));
  return rows;
};

async function seedPrinters() {
  for (const printer of printerSeeds) {
    await pool.query(
      `INSERT INTO printers
        (pmno, serial, make, model, dpi, ip, wc, loc, stage, bay, status, pmdate, sapno, mesno, firmware, loftware, remarks, maintenance_type, plant_location)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ready', $11, $12, $13, $14, $15, 'Dummy technical support seed data', 'quarterly', $16)
       ON CONFLICT (pmno) DO NOTHING`,
      [
        printer.pmno,
        printer.serial,
        printer.make,
        printer.model,
        printer.dpi,
        printer.ip,
        printer.wc,
        printer.loc,
        printer.stage,
        printer.bay,
        printer.pmdate,
        printer.sapno,
        printer.mesno,
        printer.firmware,
        printer.loftware,
        printer.plant_location,
      ]
    );
  }
}

async function seedBackupPrinters() {
  const printers = await getReferencePrinters();
  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO backup_printers
        (pmno, serial, make, dpi, plant_location, storage_location, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (pmno) DO NOTHING`,
      [
        printer.pmno,
        printer.serial || `DUMMY-BKP-${index + 1}`,
        printer.make || 'Zebra',
        printer.dpi || '203',
        printer.plant_location || 'B26',
        `Backup Rack ${index + 1}`,
        'Dummy backup printer mapped from existing PM number',
      ]
    );
  }
}

async function seedVlan() {
  const rows = [
    ['SW-B26-01/01', '10.132.20.11', '00:1A:2B:10:01:01', 'SW-B26-01', 'B26 Network Rack', 'SMT', 'Bay 1', 'WC-B26-01', 'B26'],
    ['SW-B1600-02/04', '10.132.20.12', '00:1A:2B:10:01:02', 'SW-B1600-02', 'B1600 Network Rack', 'PACK', 'Bay 2', 'WC-B1600-02', 'B1600'],
    ['SW-B1700-03/08', '10.132.20.13', '00:1A:2B:10:01:03', 'SW-B1700-03', 'B1700 Network Rack', 'TEST', 'Bay 3', 'WC-B1700-03', 'B1700'],
    ['SW-B1800-04/12', '10.132.20.14', '00:1A:2B:10:01:04', 'SW-B1800-04', 'B1800 Network Rack', 'SHIP', 'Bay 4', 'WC-B1800-04', 'B1800'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO vlan (port, ip, mac, sw, loc, stage, bay, wc, plant_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      row
    );
  }
}

async function seedSpareParts() {
  const rows = [
    ['SP-HEAD-203', '203 DPI Printhead', 'ZT411,PM43', 4, 2, 'Store A1', 'PH-203-001', 'New', 'B26', 'ZT411', 'Printhead'],
    ['SP-ROLLER-01', 'Platen Roller', 'ZT411,ZT421', 6, 2, 'Store A2', 'PR-001', 'New', 'B1600', 'ZT421', 'Roller'],
    ['SP-SENSOR-01', 'Media Sensor', 'PM43,PX940', 5, 2, 'Store B1', 'MS-001', 'New', 'B1700', 'PM43', 'Sensor'],
    ['SP-BELT-01', 'Drive Belt Kit', 'PX940', 3, 1, 'Store B2', 'DB-001', 'New', 'B1800', 'PX940', 'Drive'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO spare_parts
        (code, name, compat, avail, min, loc, serial, condition, plant_location, printer_model, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (code) DO NOTHING`,
      row
    );
  }
}

async function seedPartsUsageLog() {
  const printers = await getReferencePrinters();
  const parts = [
    ['SP-HEAD-203', '203 DPI Printhead'],
    ['SP-ROLLER-01', 'Platen Roller'],
    ['SP-SENSOR-01', 'Media Sensor'],
    ['SP-BELT-01', 'Drive Belt Kit'],
  ];

  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO parts_usage_log (code, name, qty, pmno, serial, wc, used_by)
       VALUES ($1, $2, 1, $3, $4, $5, 'Dummy Engineer')`,
      [parts[index][0], parts[index][1], printer.pmno, printer.serial, printer.wc]
    );
  }
}

async function seedHpPrinters() {
  const rows = [
    ['HP-B26-01', 'HP LaserJet M404', '10.132.30.11', 'B26 Office', 'SMT', 'Bay 1', 'WC-B26-01', 'HP-58A', 86, null, true, 'B26'],
    ['HP-B1600-02', 'HP LaserJet M507', '10.132.30.12', 'B1600 Office', 'PACK', 'Bay 2', 'WC-B1600-02', 'HP-89A', 74, null, true, 'B1600'],
    ['HP-B1700-03', 'HP Color LaserJet M479', '10.132.30.13', 'B1700 Office', 'TEST', 'Bay 3', 'WC-B1700-03', 'HP-414A', 61, 52, true, 'B1700'],
    ['HP-B1800-04', 'HP LaserJet M406', '10.132.30.14', 'B1800 Office', 'SHIP', 'Bay 4', 'WC-B1800-04', 'HP-58X', 42, null, false, 'B1800'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO hp_printers
        (tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, plant_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (tag) DO NOTHING`,
      row
    );
  }
}

async function seedCartridges() {
  const rows = [
    ['HP 58A Black', 'CF258A', 'Black', 'M404,M406', 8, 2, '3000 pages', 'Cabinet C1'],
    ['HP 58X Black', 'CF258X', 'Black', 'M404,M406', 5, 2, '10000 pages', 'Cabinet C1'],
    ['HP 89A Black', 'CF289A', 'Black', 'M507', 6, 2, '5000 pages', 'Cabinet C2'],
    ['HP 414A Color Set', 'W2020A', 'Color', 'M479', 4, 1, '2400 pages', 'Cabinet C3'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO cartridges (model, dn, type, compat, stock, min, yield, loc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (model) DO NOTHING`,
      row
    );
  }
}

async function seedCartridgeUsageLog() {
  const rows = [
    ['CF258A', 'HP 58A Black', 1, 'WC-B26-01', '10.132.30.11', 'B26 Office', 'HP-B26-01', 'Dummy Engineer'],
    ['CF258X', 'HP 58X Black', 1, 'WC-B1800-04', '10.132.30.14', 'B1800 Office', 'HP-B1800-04', 'Dummy Engineer'],
    ['CF289A', 'HP 89A Black', 1, 'WC-B1600-02', '10.132.30.12', 'B1600 Office', 'HP-B1600-02', 'Dummy Engineer'],
    ['W2020A', 'HP 414A Color Set', 1, 'WC-B1700-03', '10.132.30.13', 'B1700 Office', 'HP-B1700-03', 'Dummy Engineer'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO cartridge_usage_log (dn, model, qty, wc, ip, printer_location, printer_tag, used_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      row
    );
  }
}

async function seedRecipes() {
  const rows = [
    ['Box Label 4x6', 'Zebra', 'ZT411', '203', 'Synthetic', '4 in', '6 in', '0', '0', '18', '6 ips', 'BoxLabel.lwl', 'Enabled', 'Gap', 'Good', '4x6', 'Dummy box label recipe'],
    ['Pallet Label 6x8', 'Zebra', 'ZT421', '203', 'Paper', '6 in', '8 in', '0', '0', '20', '5 ips', 'PalletLabel.lwl', 'Enabled', 'Mark', 'Good', '6x8', 'Dummy pallet label recipe'],
    ['Unit Label 3x2', 'Honeywell', 'PM43', '300', 'Paper', '3 in', '2 in', '0', '0', '12', '4 ips', 'UnitLabel.lwl', 'Disabled', 'Gap', 'Good', '3x2', 'Dummy unit label recipe'],
    ['Carton Label 4x3', 'Honeywell', 'PX940', '300', 'Synthetic', '4 in', '3 in', '0', '0', '15', '4 ips', 'CartonLabel.lwl', 'Enabled', 'Gap', 'Good', '4x3', 'Dummy carton label recipe'],
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO recipes
        (name, make, model, dpi, media, width, length, top, left_margin, darkness, speed, loft, verifier, calibration, contrast, size, "desc", config_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, '{}'::jsonb)`,
      row
    );
  }
}

async function seedIssues() {
  const printers = await getReferencePrinters();
  const issues = [
    ['Ribbon wrinkle on print', 'Ribbon is wrinkling during print run', 'Medium', 'Print Quality'],
    ['Labels skipping intermittently', 'Printer skips labels after every few prints', 'High', 'Calibration'],
    ['Network disconnect observed', 'Printer drops from network during shift', 'Medium', 'Network'],
    ['Printhead cleaning required', 'Barcode contrast is below acceptable range', 'Low', 'Maintenance'],
  ];

  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO issues
        (pmno, serial, model, loc, title, "desc", severity, category, status, reporter, sapno, mesno, plant_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', 'dummy.engineer@jabil.com', $9, $10, $11)`,
      [
        printer.pmno,
        printer.serial,
        printer.model,
        printer.loc,
        issues[index][0],
        issues[index][1],
        issues[index][2],
        issues[index][3],
        printer.sapno,
        printer.mesno,
        printer.plant_location || 'B26',
      ]
    );
  }
}

async function seedHealthCheckups() {
  const printers = await getReferencePrinters();
  const health = ['ok', 'warning', 'ok', 'critical'];
  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO health_checkups
        (pmno, serial, model, make, sapno, mesno, dpi, firmware, km, loftware, ip, mac, loc, stage, bay, wc, health, issue_desc, req_parts, engineer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'Dummy Engineer')`,
      [
        printer.pmno,
        printer.serial,
        printer.model,
        printer.make,
        printer.sapno,
        printer.mesno,
        printer.dpi,
        printer.firmware,
        `${1200 + index * 150} km`,
        printer.loftware,
        technicalIp(index),
        `00:1A:2B:20:01:0${index + 1}`,
        printer.loc,
        printer.stage,
        printer.bay,
        printer.wc,
        health[index],
        index === 1 ? 'Minor calibration drift observed' : '',
        index === 3 ? 'Printhead cleaning kit' : '',
      ]
    );
  }
}

async function seedPmPastedLog() {
  const printers = await getReferencePrinters();
  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO pm_pasted_log
        (pmno, serial, model, make, dpi, ip, firmware, sapno, mesno, loftware, pmdate, pasted_at, stage, bay, wc, loc, engineer, shift, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE::text, NOW()::text, $11, $12, $13, $14, 'Dummy Engineer', $15, 'Dummy PM pasted log')`,
      [
        printer.pmno,
        printer.serial,
        printer.model,
        printer.make,
        printer.dpi,
        technicalIp(index),
        printer.firmware,
        printer.sapno,
        printer.mesno,
        printer.loftware,
        printer.stage,
        printer.bay,
        printer.wc,
        printer.loc,
        index % 2 === 0 ? '1st Shift' : '2nd Shift',
      ]
    );
  }
}

async function seedPrinterLiveState() {
  const printers = await getReferencePrinters();
  const statuses = [
    ['online', 'ready', null],
    ['online', 'warning', 'Ribbon low'],
    ['offline', 'error', 'Network unreachable'],
    ['online', 'ready', null],
  ];

  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO printer_live_state
        (pmno, serial, ip, online_status, condition_status, error_reason, firmware_version, printer_km, resolved_bay, resolved_stage, resolved_wc, location_display)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (pmno) DO UPDATE SET
        serial = EXCLUDED.serial,
        ip = EXCLUDED.ip,
        online_status = EXCLUDED.online_status,
        condition_status = EXCLUDED.condition_status,
        error_reason = EXCLUDED.error_reason,
        updated_at = NOW()`,
      [
        printer.pmno,
        printer.serial,
        technicalIp(index),
        statuses[index][0],
        statuses[index][1],
        statuses[index][2],
        printer.firmware,
        `${1200 + index * 150} km`,
        printer.bay,
        printer.stage,
        printer.wc,
        printer.loc,
      ]
    );
  }
}

async function seedPrinterStatusLogs() {
  const printers = await getReferencePrinters();
  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO printer_status_logs
        (pmno, serial, event_type, reason, old_online_status, new_online_status, old_condition_status, new_condition_status, old_ip, new_ip)
       VALUES ($1, $2, 'seed_status', 'Dummy technical support status log', 'offline', 'online', 'unknown', 'ready', $3, $4)`,
      [
        printer.pmno,
        printer.serial,
        `10.132.10.${11 + index}`,
        technicalIp(index),
      ]
    );
  }
}

async function seedPrinterLocationLogs() {
  const printers = await getReferencePrinters();
  for (const [index, printer] of printers.entries()) {
    await pool.query(
      `INSERT INTO printer_location_logs
        (pmno, serial, old_wc, old_stage, old_bay, old_loc, old_plant_location, new_wc, new_stage, new_bay, new_loc, new_plant_location, source, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'dummy_seed', 'Dummy Engineer')`,
      [
        printer.pmno,
        printer.serial,
        `OLD-WC-${index + 1}`,
        'STAGING',
        `Old Bay ${index + 1}`,
        `Old location ${index + 1}`,
        printer.plant_location || 'B26',
        printer.wc,
        printer.stage,
        printer.bay,
        printer.loc,
        printer.plant_location || 'B26',
      ]
    );
  }
}

async function seedHealthCheckupActivityLog() {
  const printers = await getReferencePrinters();
  for (const printer of printers) {
    await pool.query(
      `INSERT INTO health_checkup_activity_log (pmno, engineer)
       VALUES ($1, 'Dummy Engineer')`,
      [printer.pmno]
    );
  }
}

async function main() {
  try {
    await seedIfEmpty('printers', seedPrinters);
    await seedIfEmpty('backup_printers', seedBackupPrinters);
    await seedIfEmpty('vlan', seedVlan);
    await seedIfEmpty('spare_parts', seedSpareParts);
    await seedIfEmpty('parts_usage_log', seedPartsUsageLog);
    await seedIfEmpty('hp_printers', seedHpPrinters);
    await seedIfEmpty('cartridges', seedCartridges);
    await seedIfEmpty('cartridge_usage_log', seedCartridgeUsageLog);
    await seedIfEmpty('recipes', seedRecipes);
    await seedIfEmpty('issues', seedIssues);
    await seedIfEmpty('health_checkups', seedHealthCheckups);
    await seedIfEmpty('pm_pasted_log', seedPmPastedLog);
    await seedIfEmpty('printer_live_state', seedPrinterLiveState);
    await seedIfEmpty('printer_status_logs', seedPrinterStatusLogs);
    await seedIfEmpty('printer_location_logs', seedPrinterLocationLogs);
    await seedIfEmpty('health_checkup_activity_log', seedHealthCheckupActivityLog);
    console.log('[done] Technical support dummy data seed finished');
  } catch (error) {
    console.error('[error] Technical support dummy data seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
