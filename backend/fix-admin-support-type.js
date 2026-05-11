/**
 * Update admin user support_type to 'both'
 * This ensures admin users can toggle between Desktop Support and Application Support
 * Run: node fix-admin-support-type.js
 */

const pool = require('./src/db/pool');

async function fixAdminSupportType() {
  try {
    console.log('Updating admin user support types to include both desktop and application support...');
    
    // Update all admin users to have support_type = 'both'
    const result = await pool.query(
      `UPDATE users 
       SET support_type = 'both' 
       WHERE role IN ('admin', 'super_admin') 
       AND support_type != 'both'
       RETURNING id, email, role, support_type`
    );
    
    if (result.rowCount > 0) {
      console.log(`✅ Updated ${result.rowCount} admin user(s) to support_type = 'both'\n`);
      result.rows.forEach(user => {
        console.log(`  • ${user.email} (${user.role}): support_type now = ${user.support_type}`);
      });
    } else {
      console.log('✅ All admin users already have support_type = both\n');
    }
    
    // Show current admin users
    const allAdmins = await pool.query(
      `SELECT id, email, role, support_type FROM users 
       WHERE role IN ('admin', 'super_admin') 
       ORDER BY created_at DESC`
    );
    
    console.log('\n📋 Current admin user status:');
    allAdmins.rows.forEach(user => {
      console.log(`  • ${user.email} (${user.role}): support_type = ${user.support_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin support types:', error.message);
    process.exit(1);
  }
}

fixAdminSupportType();
