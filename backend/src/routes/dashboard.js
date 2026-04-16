const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

function parseSimpleDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function dateToString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateEffectivePmDate(originalPmDate, today, maintenanceType = 'quarterly') {
  const maintenanceMonths = {
    'monthly': 1,
    '2month': 2,
    'quarterly': 3,
    '4month': 4,
    'yearly': 12
  };
  
  const months = maintenanceMonths[maintenanceType] || 3;
  let effectiveDate = parseSimpleDate(originalPmDate);
  
  while (effectiveDate < today) {
    const nextCycle = new Date(effectiveDate);
    nextCycle.setMonth(nextCycle.getMonth() + months);
    if (nextCycle <= today) {
      effectiveDate = nextCycle;
    } else {
      break;
    }
  }
  
  return effectiveDate;
}

function getPmStatusAndDate(printer, today, pmPastedMap) {
  if (!printer.pmdate) return null;

  const originalPmDate = parseSimpleDate(printer.pmdate);
  const daysBefore6 = new Date(originalPmDate);
  daysBefore6.setDate(daysBefore6.getDate() - 6);
  
  let pmStatus = null;
  let displayDate = printer.pmdate;

  // Check if still in upcoming window (6 days before original PM date)
  if (today >= daysBefore6 && today < originalPmDate) {
    pmStatus = 'upcoming';
    displayDate = printer.pmdate;
  } else if (today >= originalPmDate) {
    // Original PM date has passed - calculate effective PM date based on maintenance type
    const maintenanceType = printer.maintenance_type || 'quarterly';
    const effectivePmDate = calculateEffectivePmDate(printer.pmdate, today, maintenanceType);
    displayDate = dateToString(effectivePmDate);
    
    const daysAfterPm = (today - effectivePmDate) / 86400000;
    
    if (daysAfterPm <= 5) {
      pmStatus = 'due';
    } else if (daysAfterPm > 5) {
      pmStatus = 'overdue';
    }
  }

  // Only exclude pasted PMs from due/overdue lists
  if ((pmStatus === 'due' || pmStatus === 'overdue') && pmPastedMap) {
    const pmKey = `${String(printer.pmno || '').toUpperCase()}|${printer.pmdate}`;
    if (pmPastedMap.has(pmKey)) {
      return null;
    }
  }
  
  return {
    pmStatus,
    effectivePmDate: displayDate
  };
}

router.get('/stats', async (req, res) => {
  try {
    const { plants } = req.query;
    const plantList = plants ? plants.split(',').map((p) => p.trim()) : null;

    let printerQuery = 'SELECT * FROM printers';
    const params = [];
    if (plantList && plantList.length > 0) {
      printerQuery += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }

    const [{ rows: printers }, { rows: issues }, { rows: spareParts }] = await Promise.all([
      pool.query(printerQuery, params),
      pool.query("SELECT * FROM issues WHERE status='open'" + (plantList && plantList.length > 0 ? ' AND plant_location = ANY($1)' : ''), plantList && plantList.length > 0 ? [plantList] : []),
      pool.query('SELECT * FROM spare_parts'),
    ]);

    const { rows: pmPastedRows } = await pool.query('SELECT pmno, pmdate FROM pm_pasted_log');
    
    const pmPastedMap = new Map();
    pmPastedRows.forEach(row => {
      const key = `${String(row.pmno || '').toUpperCase()}|${row.pmdate}`;
      pmPastedMap.set(key, true);
    });

    const p = printers;
    const total = p.length;
    const online = p.filter(x => x.ip && x.status !== 'offline').length;
    const offline = p.filter(x => !x.ip || x.status === 'offline').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcoming = 0;
    let due = 0;
    let overdue = 0;

    p.forEach(printer => {
      const result = getPmStatusAndDate(printer, today, pmPastedMap);
      if (!result) return;
      
      const { pmStatus } = result;
      if (pmStatus === 'upcoming') upcoming++;
      else if (pmStatus === 'due') due++;
      else if (pmStatus === 'overdue') overdue++;
    });

    const perfRows = await pool.query(
      `SELECT engineer, COUNT(*) as checkups FROM health_checkups GROUP BY engineer`
    );
    const pmPastedCountRows = await pool.query(
      `SELECT engineer, COUNT(*) as pasted FROM pm_pasted_log GROUP BY engineer`
    );

    const perfMap = {};
    perfRows.rows.forEach(r => { perfMap[r.engineer] = { checkups: parseInt(r.checkups), pasted: 0 }; });
    pmPastedCountRows.rows.forEach(r => {
      if (!perfMap[r.engineer]) perfMap[r.engineer] = { checkups: 0, pasted: 0 };
      perfMap[r.engineer].pasted = parseInt(r.pasted);
    });
    const performance = Object.entries(perfMap).map(([name, v]) => ({ name, ...v }));

    res.json({ total, online, offline, upcoming, due, overdue, openIssues: issues.length, performance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/due-overdue', async (req, res) => {
  try {
    const { plants } = req.query;
    const plantList = plants ? plants.split(',').map((p) => p.trim()) : null;

    let query = 'SELECT * FROM printers WHERE pmdate IS NOT NULL';
    const params = [];
    if (plantList && plantList.length > 0) {
      query += ' AND plant_location = ANY($1)';
      params.push(plantList);
    }
    query += ' ORDER BY pmdate';

    const { rows: printers } = await pool.query(query, params);
    const { rows: pmPastedRows } = await pool.query('SELECT pmno, pmdate FROM pm_pasted_log');
    
    const pmPastedMap = new Map();
    pmPastedRows.forEach(row => {
      const key = `${String(row.pmno || '').toUpperCase()}|${row.pmdate}`;
      pmPastedMap.set(key, true);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = printers.map(p => {
      const statusResult = getPmStatusAndDate(p, today, pmPastedMap);
      if (!statusResult) return null;
      
      const { pmStatus, effectivePmDate } = statusResult;
      
      return {
        ...p,
        pm_status: pmStatus,
        pmdate: effectivePmDate
      };
    }).filter(p => p && p.pm_status);
    
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
