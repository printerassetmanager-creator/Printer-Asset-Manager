const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');
const pool = require('../db/pool');
const { adminMiddleware } = require('../middleware/auth');

// Fetch cartridge data from HP printer web interface
router.get('/cartridge-info/:ip', async (req, res) => {
  const ip = req.params.ip;
  try {
    const data = await fetchHPCartridgeData(ip);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function fetchHPCartridgeData(ip) {
  return new Promise((resolve, reject) => {
    const url = `http://${ip}/hp/status/`;
    const request = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          // Parse HTML response to extract cartridge info
          const cartridgeModel = extractCartridgeModel(body);
          const blackPct = extractBlackLevel(body);
          const colorPct = extractColorLevel(body);
          const errorStatus = extractErrorStatus(body);
          resolve({ cartmodel: cartridgeModel, black_pct: blackPct, color_pct: colorPct, error_status: errorStatus });
        } catch (e) {
          reject(new Error(`Failed to parse printer response: ${e.message}`));
        }
      });
    });
    request.on('error', () => reject(new Error(`Cannot connect to printer at ${ip}. Ensure it is online and accessible.`)));
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout connecting to printer at ${ip}`));
    });
  });
}

function extractCartridgeModel(html) {
  // Look for cartridge model patterns: CF226A, CF225A, CF217A, etc.
  const patterns = [
    /(?:Cartridge|Toner)[\s:]*([A-Z]+\d+[A-Z])/i,
    /(?:XL|XM|XXL)?[A-Z]+\d+[A-Z]/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1] || match[0];
  }
  return 'Unknown';
}

function extractBlackLevel(html) {
  // Look for black cartridge percentage patterns
  const patterns = [
    /Black[\s\w]*?(\d+)%/i,
    /[\w]*Black[\s\w]*?(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return parseInt(match[1]);
  }
  return null;
}

function extractColorLevel(html) {
  // Look for color cartridge percentage patterns
  const patterns = [
    /Color[\s\w]*?(\d+)%/i,
    /Cyan[\s\w]*?(\d+)%/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return parseInt(match[1]);
  }
  return null;
}

function extractErrorStatus(html) {
  // Look for common printer error states
  const errorPatterns = {
    'Paper Jam': /paper\s+jam/i,
    'Front Door Open': /front\s+door\s+open/i,
    'Rear Door Open': /rear\s+door\s+open/i,
    'Toner Low': /toner\s+(?:low|empty)/i,
    'Cartridge Missing': /(?:cartridge|toner)\s+missing/i,
    'Service Required': /service\s+(?:required|needed)/i,
    'Offline': /offline/i,
    'Error': /error/i,
  };
  
  for (const [errorName, pattern] of Object.entries(errorPatterns)) {
    if (pattern.test(html)) {
      return errorName;
    }
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { plants } = req.query;
    let query = 'SELECT * FROM hp_printers';
    const params = [];
    if (plants) {
      const plantList = plants.split(',').map((p) => p.trim());
      query += ' WHERE plant_location = ANY($1)';
      params.push(plantList);
    }
    query += ' ORDER BY tag';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO hp_printers (tag,model,ip,loc,stage,bay,wc,cartmodel,black_pct,color_pct,online,plant_location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct||85, color_pct||null, online!==false, plant_location||'B26']
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, plant_location } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE hp_printers SET tag=$1,model=$2,ip=$3,loc=$4,stage=$5,bay=$6,wc=$7,cartmodel=$8,black_pct=$9,color_pct=$10,online=$11,plant_location=$12 WHERE id=$13 RETURNING *`,
      [tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, plant_location||'B26', req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sync cartridge data from HP printer IP
router.post('/sync/:id', adminMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    // Get printer from DB
    const printerResult = await pool.query('SELECT * FROM hp_printers WHERE id = $1', [id]);
    if (printerResult.rows.length === 0) return res.status(404).json({ error: 'Printer not found' });
    
    const printer = printerResult.rows[0];
    const data = await fetchHPCartridgeData(printer.ip);
    
    // Update printer with new cartridge data
    const { rows } = await pool.query(
      `UPDATE hp_printers SET cartmodel=$1,black_pct=$2,color_pct=$3,error_status=$4,last_cartridge_sync=NOW(),online=true WHERE id=$5 RETURNING *`,
      [data.cartmodel, data.black_pct, data.color_pct, data.error_status, id]
    );
    res.json(rows[0]);
  } catch (e) {
    // Mark as offline on error
    try {
      await pool.query(`UPDATE hp_printers SET online=false WHERE id=$1`, [id]);
    } catch {}
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hp_printers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
