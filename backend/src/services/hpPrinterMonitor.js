const pool = require('../db/pool');
const http = require('http');

async function syncHPPrinterCartridges() {
  const startTime = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] 📡 HP Printer Sync Starting...`);
  
  try {
    // Get all HP printers that have IPs
    const { rows: printers } = await pool.query(
      'SELECT id, tag, ip, plant_location FROM hp_printers WHERE ip IS NOT NULL ORDER BY id'
    );
    
    if (printers.length === 0) {
      console.log('ℹ️  No HP printers configured');
      return;
    }
    
    console.log(`📍 Found ${printers.length} printer(s) to fetch data from`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Fetch all printers in parallel for faster results
    const syncPromises = printers.map(async (printer) => {
      try {
        const data = await fetchHPCartridgeData(printer.ip);
        
        // Update database with latest data
        await pool.query(
          `UPDATE hp_printers 
           SET cartmodel=$1, black_pct=$2, color_pct=$3, error_status=$4, 
               last_cartridge_sync=NOW(), online=true 
           WHERE id=$5`,
          [data.cartmodel, data.black_pct, data.color_pct, data.error_status, printer.id]
        );
        
        console.log(
          `✅ ${printer.tag} (${printer.ip}): Black ${data.black_pct}% | Color ${data.color_pct || 'N/A'}%`
        );
        successCount++;
      } catch (error) {
        // Mark printer as offline if fetch fails
        await pool.query(
          'UPDATE hp_printers SET online=false, error_status=$1 WHERE id=$2',
          [error.message, printer.id]
        );
        console.log(`❌ ${printer.tag} (${printer.ip}): ${error.message}`);
        failureCount++;
      }
    });
    
    // Wait for all syncs to complete
    await Promise.all(syncPromises);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Sync Complete: ${successCount} ✅ | ${failureCount} ❌ | ${duration}s\n`);
    
  } catch (error) {
    console.error('[HP Printer Monitor] Critical Error:', error.message);
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
  console.log('🖨️  HP Printer Monitor Started');
  console.log('⏱️  Syncing printer data every 10 minutes\n');
  
  // Initial sync immediately
  syncHPPrinterCartridges().catch(err => 
    console.error('[HP Monitor] Initial sync error:', err.message)
  );
  
  // Then repeat every 10 minutes
  setInterval(() => {
    syncHPPrinterCartridges().catch(err => 
      console.error('[HP Monitor] Sync error:', err.message)
    );
  }, 10 * 60 * 1000); // 10 minutes = 600000 ms
}

module.exports = { startHPPrinterMonitor };
