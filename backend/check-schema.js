const pool = require('./src/db/pool');

// Check spare_parts columns
pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['spare_parts'])
  .then(r => {
    console.log('SPARE_PARTS COLUMNS:');
    console.log(JSON.stringify(r.rows, null, 2));
  })
  .catch(e => console.error(e));
