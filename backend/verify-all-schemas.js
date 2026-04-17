const pool = require('./src/db/pool');

async function verifyAllDatabaseConnections() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     DATABASE CONNECTION & SCHEMA VERIFICATION             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Test 1: Basic Connection
    console.log('🔗 TEST 1: Database Connection');
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL');
      console.log(`   Server time: ${result.rows[0].now}\n`);
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    // Test 2: Database Info
    console.log('📊 TEST 2: Database Information');
    const dbInfo = await pool.query(`
      SELECT current_database() as db, current_user as user, version() as version
    `);
    const { db, user, version } = dbInfo.rows[0];
    console.log(`✅ Database: ${db}`);
    console.log(`   User: ${user}`);
    console.log(`   Version: ${version.split(',')[0]}\n`);

    // Test 3: List All Tables
    console.log('📋 TEST 3: All Tables in Database');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.error('❌ No tables found! Database schema not initialized.\n');
      console.log('   Fix: Run "node setup-db.js" to initialize the database\n');
    } else {
      console.log(`✅ Found ${tables.rows.length} tables:\n`);
      tables.rows.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.table_name}`);
      });
      console.log();
    }

    // Test 4: Verify Critical Tables Exist
    console.log('🎯 TEST 4: Critical Tables Verification');
    const criticalTables = [
      'users',
      'printers',
      'vlan',
      'spare_parts',
      'hp_printers',
      'cartridges',
      'recipes',
      'issues',
      'health_checkups',
      'printer_status_logs',
      'printer_live_state',
      'pm_pasted'
    ];

    const existingTables = new Set(tables.rows.map(t => t.table_name));
    const missing = [];
    const found = [];

    criticalTables.forEach(table => {
      if (existingTables.has(table)) {
        found.push(table);
        console.log(`   ✅ ${table}`);
      } else {
        missing.push(table);
        console.log(`   ❌ ${table} - MISSING`);
      }
    });
    console.log();

    // Test 5: Table Schema Details
    if (found.length > 0) {
      console.log('📐 TEST 5: Table Schemas\n');
      
      for (const tableName of found.slice(0, 5)) { // Show first 5 tables
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
          LIMIT 10
        `, [tableName]);

        console.log(`   ${tableName}:`);
        columns.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`     - ${col.column_name}: ${col.data_type} (${nullable})`);
        });
        if (columns.rows.length > 10) {
          console.log(`     ... and ${columns.rows.length - 10} more columns`);
        }
        console.log();
      }
    }

    // Test 6: Row Counts
    console.log('📊 TEST 6: Row Counts by Table');
    for (const table of found) {
      const count = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
      const rows = count.rows[0].cnt;
      console.log(`   ${table}: ${rows} rows`);
    }
    console.log();

    // Test 7: Indexes
    console.log('🔑 TEST 7: Database Indexes');
    const indexes = await pool.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    console.log(`✅ Found ${indexes.rows.length} indexes`);
    indexes.rows.slice(0, 10).forEach(idx => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`);
    });
    if (indexes.rows.length > 10) {
      console.log(`   ... and ${indexes.rows.length - 10} more`);
    }
    console.log();

    // Test 8: Connection Pool Status
    console.log('🌊 TEST 8: Connection Pool Status');
    console.log(`   Pool size: ${pool.totalCount} connections`);
    console.log(`   Idle: ${pool.idleCount} connections`);
    console.log();

    // Test 9: Auth Table Check
    console.log('🔐 TEST 9: Auth System Check');
    try {
      const adminCount = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE role = $1', ['admin']);
      const userCount = await pool.query('SELECT COUNT(*) as cnt FROM users');
      console.log(`✅ Total users: ${userCount.rows[0].cnt}`);
      console.log(`   Admin users: ${adminCount.rows[0].cnt}`);
      
      if (adminCount.rows[0].cnt === 0) {
        console.log('   ⚠️  No admin users found - run "node setup-admin.js" after first login');
      }
    } catch (error) {
      console.log('❌ Users table not accessible:', error.message);
    }
    console.log();

    // Test 10: Summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION SUMMARY                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (missing.length === 0) {
      console.log('✅ ALL SYSTEMS OPERATIONAL - Database fully initialized\n');
      console.log('Status: Ready for application startup');
    } else {
      console.log(`⚠️ MISSING ${missing.length} CRITICAL TABLES\n`);
      console.log('Missing tables:');
      missing.forEach(t => console.log(`   - ${t}`));
      console.log('\nFix: Run the following to initialize the complete schema:\n');
      console.log('   node setup-db.js');
      console.log('   node runMigration.js\n');
    }

    await pool.end();
    process.exit(missing.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

verifyAllDatabaseConnections();
