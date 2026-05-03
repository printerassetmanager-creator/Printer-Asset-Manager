const pool = require('./src/db/pool');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      try {
        await pool.query(sql);
        console.log(`[ok] ${file} completed`);
      } catch (migrationError) {
        if (migrationError.message.includes('already exists') || migrationError.message.includes('duplicate')) {
          console.log(`[skip] ${file} already applied`);
        } else {
          throw migrationError;
        }
      }
    }

    console.log('[ok] Migrations completed successfully!');
    await pool.end();
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

runMigration();
