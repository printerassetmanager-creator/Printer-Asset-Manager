/**
 * Create Super Admin Account
 * Run this script to create the super admin user in the database
 * Node: node setup-admin.js
 */

const bcrypt = require('bcrypt');
const pool = require('./src/db/pool');

async function createSuperAdmin() {
  const email = 'aniketbhosale1012@gmail.com';
  const password = 'Admin@1212';
  const fullName = 'Super Admin';
  
  try {
    console.log('Creating super admin account...');
    
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
      'INSERT INTO users (email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, hashedPassword, fullName, 'admin', 'active']
    );
    
    const user = result.rows[0];
    console.log('✅ Super Admin account created successfully!');
    console.log('\nAccount Details:');
    console.log('Id:', user.id);
    console.log('Email:', user.email);
    console.log('Full Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Created At:', user.created_at);
    
    console.log('\n✅ You can now login with:');
    console.log('Email: aniketbhosale1012@gmail.com');
    console.log('Password: Admin@1212');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
