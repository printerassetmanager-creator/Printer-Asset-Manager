const pool = require('./src/db/pool');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_plant_location.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✓ Migration completed successfully!');
    await pool.end();
  } catch (e) {
    console.error('✗ Migration failed:', e.message);
    process.exit(1);
  }
}

runMigration();
