const pool = require('../db/pool');
const http = require('http');

async function syncHPPrinterCartridges() {
  try {
    // Get all HP printers
    const { rows: printers } = await pool.query('SELECT id, ip FROM hp_printers WHERE ip IS NOT NULL');
    
    for (const printer of printers) {
      try {
        const data = await fetchHPCartridgeData(printer.ip);
        // Update printer with cartridge data
        await pool.query(
          `UPDATE hp_printers SET cartmodel=$1,black_pct=$2,color_pct=$3,error_status=$4,last_cartridge_sync=NOW(),online=true WHERE id=$5`,
          [data.cartmodel, data.black_pct, data.color_pct, data.error_status, printer.id]
        );
      } catch (e) {
        // Mark as offline on error
        await pool.query(`UPDATE hp_printers SET online=false WHERE id=$1`, [printer.id]);
      }
    }
  } catch (e) {
    console.error('HP Printer Monitor Error:', e.message);
  }
}

async function fetchHPCartridgeData(ip) {
  return new Promise((resolve, reject) => {
    const url = `http://${ip}/hp/status/`;
    const request = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
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
    request.on('error', () => reject(new Error(`Cannot connect to printer at ${ip}`)));
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout connecting to printer at ${ip}`));
    });
  });
}

function extractCartridgeModel(html) {
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

// Start monitoring - runs every 10 minutes
function startHPPrinterMonitor() {
  console.log('HP Printer Monitor Started - syncing every 10 minutes');
  syncHPPrinterCartridges();
  setInterval(syncHPPrinterCartridges, 10 * 60 * 1000); // 10 minutes
}

module.exports = { startHPPrinterMonitor };
