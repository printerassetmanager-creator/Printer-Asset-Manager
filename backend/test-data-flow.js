/**
 * Data Flow Test Script
 * Tests the complete data flow from API to Database
 * 
 * Run: cd backend && node test-data-flow.js
 */

const pool = require('./src/db/pool');

async function testDatabaseConnection() {
  console.log('\n=== TEST 1: Database Connection ===');
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('PASS: Database connected successfully');
    console.log('     Server Time: ' + result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('FAIL: Database connection failed - ' + error.message);
    return false;
  }
}

async function testTablesExist() {
  console.log('\n=== TEST 2: Required Tables Exist ===');
  
  const requiredTables = [
    'users',
    'printers',
    'spare_parts',
    'issues',
    'health_checkups',
    'cartridges',
    'backup_printers',
    'recipes',
    'hp_printers',
    'printer_live_state'
  ];
  
  let allExist = true;
  
  for (const table of requiredTables) {
    try {
      await pool.query('SELECT 1 FROM ' + table + ' LIMIT 1');
      console.log('PASS: Table ' + table + ' exists');
    } catch (error) {
      console.error('FAIL: Table ' + table + ' missing - ' + error.message);
      allExist = false;
    }
  }
  
  return allExist;
}

async function testPrinterInsertFlow() {
  console.log('\n=== TEST 3: Printer Insert Data Flow ===');
  
  const testPrinter = {
    pmno: 'TEST-' + Date.now(),
    serial: 'TEST-SERIAL-' + Date.now(),
    make: 'Honeywell',
    model: 'PM43',
    dpi: '203',
    ip: '192.168.1.999',
    wc: 'WC-TEST',
    stage: 'F1',
    bay: 'Bay-A',
    status: 'ready',
    pmdate: new Date().toISOString().split('T')[0],
    sapno: 'SAP999',
    mesno: 'MES999',
    firmware: 'TEST-FW',
    plant_location: 'B26',
    maintenance_type: 'quarterly'
  };
  
  try {
    // Insert printer
    const insertResult = await pool.query(
      'INSERT INTO printers (pmno, serial, make, model, dpi, ip, wc, stage, bay, status, pmdate, sapno, mesno, firmware, plant_location, maintenance_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
      [
        testPrinter.pmno,
        testPrinter.serial,
        testPrinter.make,
        testPrinter.model,
        testPrinter.dpi,
        testPrinter.ip,
        testPrinter.wc,
        testPrinter.stage,
        testPrinter.bay,
        testPrinter.status,
        testPrinter.pmdate,
        testPrinter.sapno,
        testPrinter.mesno,
        testPrinter.firmware,
        testPrinter.plant_location,
        testPrinter.maintenance_type
      ]
    );
    
    const insertedId = insertResult.rows[0].id;
    console.log('PASS: Printer inserted successfully');
    console.log('     PM No: ' + insertResult.rows[0].pmno);
    console.log('     ID: ' + insertedId);
    
    // Retrieve printer
    const selectResult = await pool.query('SELECT * FROM printers WHERE id = $1', [insertedId]);
    
    if (selectResult.rows.length > 0) {
      console.log('PASS: Printer retrieved successfully');
      console.log('     Retrieved PM No: ' + selectResult.rows[0].pmno);
      console.log('     Retrieved Serial: ' + selectResult.rows[0].serial);
    } else {
      console.error('FAIL: Printer retrieval failed - no rows returned');
      return false;
    }
    
    // Update printer
    const newIp = '192.168.1.100';
    await pool.query(
      'UPDATE printers SET ip = $1, updated_at = NOW() WHERE id = $2',
      [newIp, insertedId]
    );
    
    const updatedResult = await pool.query('SELECT ip FROM printers WHERE id = $1', [insertedId]);
    
    if (updatedResult.rows[0].ip === newIp) {
      console.log('PASS: Printer updated successfully');
      console.log('     New IP: ' + updatedResult.rows[0].ip);
    } else {
      console.error('FAIL: Printer update failed');
      return false;
    }
    
    // Delete printer
    await pool.query('DELETE FROM printers WHERE id = $1', [insertedId]);
    
    const deletedResult = await pool.query('SELECT * FROM printers WHERE id = $1', [insertedId]);
    
    if (deletedResult.rows.length === 0) {
      console.log('PASS: Printer deleted successfully');
    } else {
      console.error('FAIL: Printer deletion failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('FAIL: Printer data flow test failed - ' + error.message);
    return false;
  }
}

async function testSparePartsFlow() {
  console.log('\n=== TEST 4: Spare Parts Data Flow ===');
  
  const testPart = {
    code: 'PART-TEST-' + Date.now(),
    name: 'Test Part Name',
    compat: 'PM43',
    avail: 10,
    min: 2,
    loc: 'Storage-A',
    condition: 'New',
    plant_location: 'B26',
    printer_model: 'PM43',
    category: 'Electronics'
  };
  
  try {
    // Insert spare part
    const insertResult = await pool.query(
      'INSERT INTO spare_parts (code, name, compat, avail, min, loc, condition, plant_location, printer_model, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        testPart.code,
        testPart.name,
        testPart.compat,
        testPart.avail,
        testPart.min,
        testPart.loc,
        testPart.condition,
        testPart.plant_location,
        testPart.printer_model,
        testPart.category
      ]
    );
    
    const insertedId = insertResult.rows[0].id;
    console.log('PASS: Spare part inserted successfully');
    console.log('     Code: ' + insertResult.rows[0].code);
    
    // Use spare part (decrement stock)
    await pool.query(
      'INSERT INTO parts_usage_log (code, name, qty, pmno, used_by) VALUES ($1, $2, $3, $4, $5)',
      [testPart.code, testPart.name, 1, 'TEST-PMNO', 'Test User']
    );
    
    await pool.query(
      'UPDATE spare_parts SET avail = avail - 1 WHERE code = $1',
      [testPart.code]
    );
    
    const updatedResult = await pool.query('SELECT avail FROM spare_parts WHERE code = $1', [testPart.code]);
    
    if (updatedResult.rows[0].avail === 9) {
      console.log('PASS: Spare part usage logged and stock decremented');
      console.log('     Remaining stock: ' + updatedResult.rows[0].avail);
    } else {
      console.error('FAIL: Spare part stock decrement failed');
      return false;
    }
    
    // Delete spare part
    await pool.query('DELETE FROM spare_parts WHERE id = $1', [insertedId]);
    console.log('PASS: Spare part deleted successfully');
    
    return true;
  } catch (error) {
    console.error('FAIL: Spare parts data flow test failed - ' + error.message);
    return false;
  }
}

async function testIssuesFlow() {
  console.log('\n=== TEST 5: Issues Data Flow ===');
  
  const testIssue = {
    pmno: 'TEST-PRINTER',
    serial: 'TEST-SERIAL',
    model: 'PM43',
    loc: 'Test Location',
    title: 'Test Issue - ' + Date.now(),
    desc: 'This is a test issue description',
    severity: 'Low',
    category: 'Other',
    reporter: 'test@example.com',
    plant_location: 'B26'
  };
  
  try {
    // Create issue
    const insertResult = await pool.query(
      'INSERT INTO issues (pmno, serial, model, loc, title, desc, severity, category, reporter, plant_location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, \'open\') RETURNING *',
      [
        testIssue.pmno,
        testIssue.serial,
        testIssue.model,
        testIssue.loc,
        testIssue.title,
        testIssue.desc,
        testIssue.severity,
        testIssue.category,
        testIssue.reporter,
        testIssue.plant_location
      ]
    );
    
    const issueId = insertResult.rows[0].id;
    console.log('PASS: Issue created successfully');
    console.log('     Title: ' + insertResult.rows[0].title);
    console.log('     ID: ' + issueId);
    
    // Update issue (assign)
    const assignedTo = 'assignee@example.com';
    await pool.query(
      'UPDATE issues SET assigned_to = $1, status = $2 WHERE id = $3',
      [assignedTo, 'in-progress', issueId]
    );
    
    const assignedResult = await pool.query('SELECT assigned_to, status FROM issues WHERE id = $1', [issueId]);
    
    if (assignedResult.rows[0].assigned_to === assignedTo) {
      console.log('PASS: Issue assigned successfully');
      console.log('     Assigned to: ' + assignedResult.rows[0].assigned_to);
    } else {
      console.error('FAIL: Issue assignment failed');
      return false;
    }
    
    // Resolve issue
    await pool.query(
      'UPDATE issues SET status = \'resolved\', resolved_at = NOW(), action = \'Test resolution\' WHERE id = $1',
      [issueId]
    );
    
    const resolvedResult = await pool.query('SELECT status FROM issues WHERE id = $1', [issueId]);
    
    if (resolvedResult.rows[0].status === 'resolved') {
      console.log('PASS: Issue resolved successfully');
      console.log('     Status: ' + resolvedResult.rows[0].status);
    } else {
      console.error('FAIL: Issue resolution failed');
      return false;
    }
    
    // Delete issue
    await pool.query('DELETE FROM issues WHERE id = $1', [issueId]);
    console.log('PASS: Issue deleted successfully');
    
    return true;
  } catch (error) {
    console.error('FAIL: Issues data flow test failed - ' + error.message);
    return false;
  }
}

async function testHealthCheckupFlow() {
  console.log('\n=== TEST 6: Health Checkup Data Flow ===');
  
  const testCheckup = {
    pmno: 'TEST-PMNO',
    serial: 'TEST-SERIAL',
    model: 'PM43',
    make: 'Honeywell',
    dpi: '203',
    ip: '192.168.1.99',
    loc: 'Test Location',
    stage: 'F1',
    bay: 'Bay-A',
    wc: 'WC-TEST',
    health: 'ok',
    engineer: 'Test Engineer'
  };
  
  try {
    // Create health checkup
    const insertResult = await pool.query(
      'INSERT INTO health_checkups (pmno, serial, model, make, dpi, ip, loc, stage, bay, wc, health, engineer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [
        testCheckup.pmno,
        testCheckup.serial,
        testCheckup.model,
        testCheckup.make,
        testCheckup.dpi,
        testCheckup.ip,
        testCheckup.loc,
        testCheckup.stage,
        testCheckup.bay,
        testCheckup.wc,
        testCheckup.health,
        testCheckup.engineer
      ]
    );
    
    const checkupId = insertResult.rows[0].id;
    console.log('PASS: Health checkup created successfully');
    console.log('     PM No: ' + insertResult.rows[0].pmno);
    console.log('     Health: ' + insertResult.rows[0].health);
    
    // Retrieve checkup
    const selectResult = await pool.query('SELECT * FROM health_checkups WHERE id = $1', [checkupId]);
    
    if (selectResult.rows.length > 0) {
      console.log('PASS: Health checkup retrieved successfully');
    } else {
      console.error('FAIL: Health checkup retrieval failed');
      return false;
    }
    
    // Delete checkup
    await pool.query('DELETE FROM health_checkups WHERE id = $1', [checkupId]);
    console.log('PASS: Health checkup deleted successfully');
    
    return true;
  } catch (error) {
    console.error('FAIL: Health checkup data flow test failed - ' + error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('==================================================');
  console.log('DATA FLOW TEST SUITE - Printer Asset Management');
  console.log('==================================================');
  
  const results = {
    'Database Connection': false,
    'Tables Exist': false,
    'Printer Data Flow': false,
    'Spare Parts Data Flow': false,
    'Issues Data Flow': false,
    'Health Checkup Data Flow': false
  };
  
  // Run tests
  results['Database Connection'] = await testDatabaseConnection();
  if (!results['Database Connection']) {
    console.error('\nCRITICAL: Database not connected. Stopping tests.');
    process.exit(1);
  }
  
  results['Tables Exist'] = await testTablesExist();
  results['Printer Data Flow'] = await testPrinterInsertFlow();
  results['Spare Parts Data Flow'] = await testSparePartsFlow();
  results['Issues Data Flow'] = await testIssuesFlow();
  results['Health Checkup Data Flow'] = await testHealthCheckupFlow();
  
  // Print summary
  console.log('\n==================================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('==================================================');
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, result] of Object.entries(results)) {
    if (result) {
      console.log('PASS: ' + testName);
      passed++;
    } else {
      console.error('FAIL: ' + testName);
      failed++;
    }
  }
  
  console.log('\nTotal: ' + passed + ' passed, ' + failed + ' failed');
  
  if (failed > 0) {
    console.error('\nSome tests failed!');
    process.exit(1);
  } else {
    console.log('\nAll data flow tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('FAIL: Test suite failed with error - ' + error);
  process.exit(1);
});
