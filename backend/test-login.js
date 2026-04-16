const bcrypt = require('bcrypt');
const pool = require('./src/db/pool');

async function testLogin() {
  const email = 'aniketbhosale1012@gmail.com';
  const password = 'Admin@1212';
  
  try {
    console.log('Testing login...\n');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Get user from database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(0);
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ User found:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    console.log('  Password Hash:', user.password_hash.substring(0, 20) + '...');
    
    // Test password
    console.log('\nTesting password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('\nThe stored hash does not match the provided password.');
      console.log('You may need to recreate the account.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
