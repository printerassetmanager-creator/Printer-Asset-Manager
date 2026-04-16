const pool = require('./src/db/pool');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    }
    
    console.log('\n✓ All migrations completed successfully!');
    await pool.end();
  } catch (e) {
    console.error('✗ Migration failed:', e.message);
    process.exit(1);
  }
}

runAllMigrations();
