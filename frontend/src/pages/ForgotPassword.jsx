import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  HashIcon,
  KeyIcon,
  LockIcon,
  MailIcon,
  SendIcon,
  ShieldIcon,
} from '../components/AuthFrame';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(email, otp, newPassword, confirmPassword);
      setSuccess('Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">JABIL</div>
        <h1 className="login-title">Change Password</h1>
        <p className="login-subtitle">
          {step === 1 ? 'Enter your registered email address' : 'Verify OTP and enter a new password'}
        </p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            step === 1 ? handleSendOTP() : handleResetPassword();
          }}
        >
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <div className="login-input">
              <span className="login-icon"><MailIcon /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading || step === 2}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {step === 2 && (
            <>
              <div className="login-field">
                <label className="login-label">Email OTP</label>
                <div className="login-input">
                  <span className="login-icon"><HashIcon /></span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter OTP"
                    disabled={loading}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">New Password</label>
                <div className="login-input">
                  <span className="login-icon"><LockIcon /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Confirm Password</label>
                <div className="login-input">
                  <span className="login-icon"><LockIcon /></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (step === 1 ? 'Sending...' : 'Resetting...') : step === 1 ? 'Send OTP' : 'Reset Password'}
          </button>
        </form>

        <div className="login-footer auth-footer-row">
          {step === 2 && (
            <button
              type="button"
              className="login-link"
              onClick={() => setStep(1)}
            >
              <ArrowLeftIcon /> Back to Email
            </button>
          )}
          <button type="button" className="login-link" onClick={onBack}>
            Back to Login
          </button>
        </div>

        <div className="auth-note">
          <span className="auth-note-icon"><ShieldIcon /></span>
          Reset your password securely using email OTP verification before returning to your account.
        </div>
      </div>
    </div>
  );
}
