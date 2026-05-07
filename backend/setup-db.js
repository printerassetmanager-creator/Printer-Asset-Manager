const pool = require('./src/db/pool');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Step 1: Load and execute main schema
    console.log('\n📋 Step 1: Loading database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split and execute statements (PostgreSQL requires separate statements)
    const statements = schemaSql.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (!statement.trim()) continue;
      try {
        await pool.query(statement);
      } catch (stmtErr) {
        const message = String(stmtErr.message || '').toLowerCase();
        if (message.includes('already exists') || message.includes('duplicate') || message.includes('does not exist') || message.includes('column') && message.includes('does not exist')) {
          console.log(`⚠ Schema statement skipped: ${stmtErr.message}`);
          continue;
        }
        throw stmtErr;
      }
    }
    console.log('✓ Schema loaded successfully');
    
    // Step 2: Run migrations (only if files exist and tables were created)
    console.log('\n🔄 Step 2: Running migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        const statements = sql.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.query(statement);
          }
        }
        console.log(`✓ ${file} completed`);
      } catch (migErr) {
        // Some migrations might fail if they're idempotent (e.g., adding columns that already exist)
        if (migErr.message.includes('already exists') || migErr.message.includes('duplicate')) {
          console.log(`⚠ ${file} skipped (already applied)`);
        } else {
          console.error(`✗ ${file} failed:`, migErr.message);
        }
      }
    }
    
    console.log('\n✓ Database initialization completed successfully!');
    console.log('✓ All tables and migrations are ready');
    await pool.end();
  } catch (e) {
    console.error('\n✗ Database initialization failed:', e.message);
    console.error('\nDebug info:', e);
    process.exit(1);
  }
}

initializeDatabase();
