require('dotenv').config();
const app = require('./app');
const pool = require('./db/pool');
const { startPrinterMonitor } = require('./services/printerMonitor');
const { startHPPrinterMonitor } = require('./services/hpPrinterMonitor');
const { startApplicationSupportMonitor } = require('./services/applicationSupportMonitor');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     PRINTER ASSET MANAGER - SERVER STARTUP                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('🔗 Testing database connection...');
    const connTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    console.log('📋 Verifying database schema...');
    const criticalTables = ['users', 'printers', 'hp_printers'];
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = new Set(tables.rows.map(t => t.table_name));

    let missingTables = [];
    for (const table of criticalTables) {
      if (existingTables.has(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      console.error('\n⚠️  DATABASE SCHEMA NOT FULLY INITIALIZED');
      console.error('\nMissing tables:', missingTables.join(', '));
      console.error('\nTo fix, run one of these commands in backend directory:');
      console.error('  node setup-db.js');
      console.error('  OR');
      console.error('  npm run setup-db\n');
      console.warn('⚠️  Server will start but some features may not work\n');
    } else {
      console.log('✅ All critical tables present\n');
    }

    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`\n📊 API Endpoints ready:`);
      console.log(`   - /api/auth/login`);
      console.log(`   - /api/printers`);
      console.log(`   - /api/health (health check)`);
      console.log('\n🌐 Frontend: http://localhost:3000');
      console.log(`📡 Backend API: http://localhost:${PORT}\n`);
    });

    try {
      if (existingTables.has('printers')) {
        startPrinterMonitor();
        console.log('🖨️  Printer monitor started');
      }
    } catch (err) {
      console.warn('⚠️  Printer monitor failed to start:', err.message);
    }

    try {
      if (existingTables.has('hp_printers')) {
        startHPPrinterMonitor();
        console.log('🖨️  HP Printer monitor started\n');
      }
    } catch (err) {
      console.warn('⚠️  HP Printer monitor failed to start:', err.message);
    }

    try {
      await startApplicationSupportMonitor();
      console.log('Application support server monitor started');
    } catch (err) {
      console.warn('Application support monitor failed to start:', err.message);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR during startup:');
    console.error('Error:', error.message);
    console.error('\nCommon fixes:');
    console.error('  1. Check database is running: sudo systemctl start postgresql');
    console.error('  2. Verify .env file has correct DB credentials');
    console.error('  3. Initialize database: node setup-db.js');
    console.error('  4. Check database exists: createdb printer_ms\n');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
