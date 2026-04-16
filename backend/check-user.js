const pool = require('./src/db/pool');

async function checkUser() {
  try {
    console.log('Checking super admin account...\n');
    
    const result = await pool.query(
      'SELECT id, email, full_name, role, status FROM users WHERE email = $1',
      ['aniketbhosale1012@gmail.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log('  Id:', user.id);
      console.log('  Email:', user.email);
      console.log('  Full Name:', user.full_name);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
