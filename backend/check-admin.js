const pool = require('./src/db/pool');

(async () => {
  try {
    const result = await pool.query('SELECT id, email, role, status FROM users WHERE email = $1', ['aniketbhosale1012@gmail.com']);
    if (result.rows.length === 0) {
      console.log('❌ User not found');
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
    }
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    process.exit(0);
  }
})();
