const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { sendOTP, sendRegistrationOTP } = require('../services/emailService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const ALLOWED_SUPPORT_TYPES = ['technical', 'application', 'both'];
const normalizeSupportType = (supportType) => {
  const requestedType = String(supportType || 'technical').trim().toLowerCase();
  return ALLOWED_SUPPORT_TYPES.includes(requestedType) ? requestedType : 'technical';
};

const ensureRegistrationOtpsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registration_otps (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_registration_otps_email_created
      ON registration_otps (email, created_at DESC)
  `);
};

// ═══ SEND REGISTRATION OTP - Verify email before account creation ═══
router.post('/send-registration-otp', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    await ensureRegistrationOtpsTable();

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO registration_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await sendRegistrationOTP(email, otp);

    res.json({ message: 'Verification OTP sent to your email' });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    const message = error.code === 'EMAIL_NOT_CONFIGURED'
      ? error.message
      : error.code === 'EAUTH' && error.response?.includes('BadCredentials')
        ? 'Gmail username or app password is incorrect.'
      : error.code === 'EAUTH'
        ? 'Gmail rejected the login. Use a Gmail App Password for EMAIL_PASSWORD.'
      : error.message?.includes('ETIMEDOUT')
        ? 'Could not connect to the email server. Check internet access and Gmail SMTP settings.'
        : 'Failed to send registration OTP';
    res.status(500).json({ error: message });
  }
});

// ═══ REGISTER - Create new account (pending approval) ═══
router.post('/register', async (req, res) => {
  const { email, password, confirmPassword, fullName, otp, supportType } = req.body;

  try {
    // Validation
    if (!email || !password || !confirmPassword || !otp) {
      return res.status(400).json({ error: 'Email, password, confirmPassword, and OTP are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    await ensureRegistrationOtpsTable();

    const otpResult = await pool.query(
      `SELECT id
       FROM registration_otps
       WHERE email = $1 AND otp = $2 AND expires_at > NOW() AND is_used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine support type (default to technical)
    const support_type = normalizeSupportType(supportType);

    // Create user with 'pending' status and support_type
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, support_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, support_type, status',
      [email, hashedPassword, fullName || email, support_type, 'pending']
    );

    const user = result.rows[0];

    // Create approval request
    await pool.query('INSERT INTO user_approvals (user_id, status) VALUES ($1, $2)', [user.id, 'pending']);

    await pool.query('UPDATE registration_otps SET is_used = TRUE WHERE id = $1', [otpResult.rows[0].id]);

    res.status(201).json({
      message: 'Email verified. Account created successfully and sent for approval.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        status: user.status,
        support_type: user.support_type,
        supportType: user.support_type,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error.code === '23505'
      ? 'A user with this email already exists'
      : error.message || 'Registration failed';
    res.status(500).json({ error: message });
  }
});

// ═══ LOGIN ═══
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN] Attempting login for:', email);

  try {
    if (!email || !password) {
      console.log('[LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('[LOGIN] Searching for user:', email);
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.log('[LOGIN] User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    console.log('[LOGIN] User found - Status:', user.status, 'Role:', user.role);

    // Check if account is approved
    if (user.status === 'pending') {
      console.log('[LOGIN] Account pending approval');
      return res.status(403).json({ error: 'Your account is pending approval' });
    }

    if (user.status === 'rejected') {
      console.log('[LOGIN] Account rejected');
      return res.status(403).json({ error: 'Your account has been rejected' });
    }

    // Verify password
    console.log('[LOGIN] Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.full_name, supportType: user.support_type },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('[LOGIN] ✅ Login successful for:', email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        support_type: user.support_type,
        supportType: user.support_type,
      },
    });
  } catch (error) {
    console.error('[LOGIN] ❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ═══ FORGOT PASSWORD - Send OTP ═══
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If this email exists, an OTP has been sent' });
    }

    const user = userResult.rows[0];

    // Generate OTP
    const otp = generateOTP();

    // Save OTP with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, otp, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send OTP via email
    await sendOTP(user.email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    const message = error.code === 'EMAIL_NOT_CONFIGURED'
      ? error.message
      : error.code === 'EAUTH' && error.response?.includes('BadCredentials')
        ? 'Gmail username or app password is incorrect.'
      : error.code === 'EAUTH'
        ? 'Gmail rejected the login. Use a Gmail App Password for EMAIL_PASSWORD.'
      : error.message?.includes('ETIMEDOUT')
        ? 'Could not connect to the email server. Check internet access and Gmail SMTP settings.'
        : 'Failed to process forgot password request';
    res.status(500).json({ error: message });
  }
});

// ═══ VERIFY OTP AND RESET PASSWORD ═══
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify OTP
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE user_id = $1 AND otp = $2 AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
      [user.id, otp]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);

    // Mark OTP as used
    await pool.query('UPDATE password_reset_tokens SET is_used = TRUE WHERE id = $1', [tokenResult.rows[0].id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ═══ GET CURRENT USER ═══
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id, email, full_name, role, support_type FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      support_type: user.support_type,
      supportType: user.support_type,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ═══ UPDATE PASSWORD (Authenticated user) ═══
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
