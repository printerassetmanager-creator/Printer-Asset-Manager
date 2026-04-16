const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/stats', async (req, res) => {
  try {
    const [printers, issues, spare] = await Promise.all([
      pool.query('SELECT * FROM printers'),
      pool.query("SELECT * FROM issues WHERE status='open'"),
      pool.query('SELECT * FROM spare_parts'),
    ]);

    const p = printers.rows;
    const total = p.length;
    const online = p.filter(x => x.ip && x.status !== 'offline').length;
    const offline = p.filter(x => !x.ip || x.status === 'offline').length;

    const today = new Date();
    const in5 = new Date(today); in5.setDate(today.getDate() + 5);
    const upcoming = p.filter(x => {
      if (!x.pmdate) return false;
      const d = new Date(x.pmdate);
      return d >= today && d <= in5;
    }).length;
    const due = p.filter(x => {
      if (!x.pmdate) return false;
      const d = new Date(x.pmdate);
      const diff = (today - d) / 86400000;
      return diff >= 0 && diff <= 7;
    }).length;
    const overdue = p.filter(x => {
      if (!x.pmdate) return false;
      const d = new Date(x.pmdate);
      return (today - d) / 86400000 > 7;
    }).length;

    const perfRows = await pool.query(
      `SELECT engineer, COUNT(*) as checkups FROM health_checkups GROUP BY engineer`
    );
    const pmPastedRows = await pool.query(
      `SELECT engineer, COUNT(*) as pasted FROM pm_pasted_log GROUP BY engineer`
    );

    const perfMap = {};
    perfRows.rows.forEach(r => { perfMap[r.engineer] = { checkups: parseInt(r.checkups), pasted: 0 }; });
    pmPastedRows.rows.forEach(r => {
      if (!perfMap[r.engineer]) perfMap[r.engineer] = { checkups: 0, pasted: 0 };
      perfMap[r.engineer].pasted = parseInt(r.pasted);
    });
    const performance = Object.entries(perfMap).map(([name, v]) => ({ name, ...v }));

    res.json({ total, online, offline, upcoming, due, overdue, openIssues: issues.rows.length, performance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/due-overdue', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM printers WHERE pmdate IS NOT NULL ORDER BY pmdate');
    const today = new Date();
    const result = rows.map(p => {
      const d = new Date(p.pmdate);
      const diff = (today - d) / 86400000;
      let pmStatus = null;
      if (diff > 7) pmStatus = 'overdue';
      else if (diff >= 0) pmStatus = 'due';
      else {
        const in5 = new Date(today); in5.setDate(today.getDate() + 5);
        if (d <= in5) pmStatus = 'upcoming';
      }
      return { ...p, pm_status: pmStatus };
    }).filter(p => p.pm_status);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
