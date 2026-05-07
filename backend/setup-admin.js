/**
 * Create admin account for both desktop support and application support
 * Run this script to create the admin user in the database
 * Node: node setup-admin.js
 */

const bcrypt = require('bcrypt');
const pool = require('./src/db/pool');

async function createAdmin() {
  const email = 'aniketbhosale4993@gmail.com';
  const password = '123456';
  const fullName = 'Admin User';
  
  try {
    console.log('Creating admin account...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed:', hashedPassword);
    
    // Check if user already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('❌ User already exists!');
      const user = existing.rows[0];
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      process.exit(0);
    }
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, support_type, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, hashedPassword, fullName, 'both', 'admin', 'active']
    );
    
    const user = result.rows[0];
    console.log('✅ Admin account created successfully!');
    console.log('\nAccount Details:');
    console.log('Id:', user.id);
    console.log('Email:', user.email);
    console.log('Full Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Support Type:', user.support_type);
    console.log('Status:', user.status);
    console.log('Created At:', user.created_at);
    
    console.log('\n✅ You can now login with:');
    console.log('Email: aniketbhosale4993@gmail.com');
    console.log('Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
