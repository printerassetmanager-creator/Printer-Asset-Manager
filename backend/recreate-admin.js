const pool = require('./src/db/pool');

async function deleteAndRecreate() {
  const bcrypt = require('bcrypt');
  const email = 'aniketbhosale1012@gmail.com';
  const password = 'Admin@1212';
  
  try {
    console.log('Deleting existing account...');
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    console.log('✅ Deleted\n');
    
    console.log('Creating new super admin account...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, support_type, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, hashedPassword, 'Super Admin', 'technical', 'super_admin', 'active']
    );
    
    const user = result.rows[0];
    console.log('✅ Super Admin account created!');
    console.log('\nAccount Details:');
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.full_name);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAndRecreate();
