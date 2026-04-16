const pool = require('./src/db/pool');

async function testDatabase() {
  try {
    console.log('Testing database connections...\n');
    
    // Test 1: Check issue_activity_log table structure
    console.log('📋 Checking issue_activity_log table structure:');
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'issue_activity_log'
      ORDER BY ordinal_position
    `);
    
    if (columns.length === 0) {
      console.log('❌ issue_activity_log table does not exist!');
    } else {
      console.log('✓ Columns in issue_activity_log:');
      columns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    }
    
    // Test 2: Check if issues table exists
    console.log('\n📋 Checking issues table structure:');
    const { rows: issuesColumns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'issues'
      ORDER BY ordinal_position
    `);
    
    if (issuesColumns.length === 0) {
      console.log('❌ issues table does not exist!');
    } else {
      console.log('✓ Found issues table with ' + issuesColumns.length + ' columns');
    }
    
    // Test 3: Check current issues
    console.log('\n📊 Testing with sample issue:');
    const { rows: testIssues } = await pool.query('SELECT id, created_at, severity FROM issues LIMIT 1');
    if (testIssues.length > 0) {
      const issue = testIssues[0];
      console.log(`✓ Sample issue found: ID=${issue.id}, Severity=${issue.severity}, Created=${issue.created_at}`);
    } else {
      console.log('⚠ No issues in database yet');
    }
    
    console.log('\n✓ Database connection test passed!');
    await pool.end();
  } catch (e) {
    console.error('\n❌ Database test failed:', e.message);
    process.exit(1);
  }
}

testDatabase();
