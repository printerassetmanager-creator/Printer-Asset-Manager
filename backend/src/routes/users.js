const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, superAdminMiddleware } = require('../middleware/auth');
const { sendAccountApprovalNotification, sendAccountRejectionNotification } = require('../services/emailService');

const router = express.Router();

// ═══ GET ALL USERS (Admin only) ═══
router.get('/users', superAdminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, COALESCE(NULLIF(full_name, ''), email) AS full_name, role, status, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ═══ GET PENDING USER APPROVALS (Admin only) ═══
router.get('/pending-approvals', superAdminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ua.id,
             u.id as user_id,
             u.email,
             COALESCE(NULLIF(u.full_name, ''), u.email) AS full_name,
             u.created_at,
             ua.requested_at,
             ua.status,
             ua.approved_by, ua.approved_at,
             CASE
               WHEN ua.approved_by IS NOT NULL THEN (
                 SELECT COALESCE(NULLIF(full_name, ''), email)
                 FROM users
                 WHERE email = ua.approved_by
                 LIMIT 1
               )
               ELSE NULL
             END as approver_name
      FROM user_approvals ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.status = 'pending'
      ORDER BY ua.requested_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// ═══ APPROVE USER (Admin only) ═══
router.post('/approve-user/:userId', superAdminMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { role = 'user' } = req.body;

  try {
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user", "admin", or "super_admin"' });
    }

    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Update user status and selected role
    await pool.query('UPDATE users SET status = $1, role = $2 WHERE id = $3', ['active', role, userId]);

    // Update approval record
    await pool.query(
      'UPDATE user_approvals SET status = $1, approved_by = $2, approved_at = NOW() WHERE user_id = $3',
      ['approved', req.user.email, userId]
    );

    let warning = null;
    try {
      await sendAccountApprovalNotification(user.email, user.full_name || user.email);
    } catch (emailError) {
      console.error('Approval email warning:', emailError);
      warning = 'User approved, but approval email could not be sent.';
    }

    res.json({
      message: warning || `User approved successfully as ${role}`,
      warning,
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// ═══ REJECT USER (Admin only) ═══
router.post('/reject-user/:userId', superAdminMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    let warning = null;
    try {
      await sendAccountRejectionNotification(user.email, user.full_name || user.email, reason);
    } catch (emailError) {
      console.error('Rejection email warning:', emailError);
      warning = 'User removed from the database, but rejection email could not be sent.';
    }

    res.json({
      message: warning || 'User rejected and removed from the database successfully',
      warning,
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ═══ CHANGE USER ROLE (Admin only) ═══
router.post('/change-user-role/:userId', superAdminMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user", "admin", or "super_admin"' });
    }

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ error: 'Super admin cannot change their own role' });
    }

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

// ═══ DELETE USER (Admin only) ═══
router.delete('/users/:userId', superAdminMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    // Prevent deleting self
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ═══ GET ALL USERS FOR LISTING (Authenticated users can see all users) ═══
router.get('/all-users', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, COALESCE(NULLIF(full_name, ''), email) AS full_name, role
       FROM users
       WHERE status = $1
       ORDER BY full_name`,
      ['active']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
