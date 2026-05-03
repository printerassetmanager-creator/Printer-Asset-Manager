const pool = require('./src/db/pool');

// Check issues columns
pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['issues'])
  .then(r => {
    console.log('ISSUES COLUMNS:');
    console.log(JSON.stringify(r.rows, null, 2));
  })
  .catch(e => console.error(e));
