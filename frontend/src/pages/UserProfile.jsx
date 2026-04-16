import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

const roleLabel = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'User';
};

export default function UserProfile({ user, onClose, onLogout }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await authAPI.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
        token
      );
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content user-profile-box">
        <div className="modal-header">
          <h2>👤 User Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-info">
          <div className="profile-item">
            <label>Full Name</label>
            <p>{user.fullName}</p>
          </div>
          <div className="profile-item">
            <label>Email</label>
            <p>{user.email}</p>
          </div>
          <div className="profile-item">
            <label>Role</label>
            <p>{roleLabel(user.role)}</p>
          </div>
        </div>

        {!showPasswordForm ? (
          <div className="profile-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowPasswordForm(true)}
            >
              🔐 Change Password
            </button>
            <button className="btn btn-danger" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="password-form">
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label>Current Password *</label>
              <div className="password-input">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password (min 6 characters) *</label>
              <div className="password-input">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPasswordForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
