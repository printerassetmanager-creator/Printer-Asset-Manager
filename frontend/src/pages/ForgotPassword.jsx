import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  AuthDivider,
  AuthFrame,
  AuthNotice,
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
    <AuthFrame
      title="Forgot Password"
      subtitle={step === 1 ? 'Enter your registered email address' : 'Verify OTP and enter a new password'}
      icon={<KeyIcon />}
      accent="check"
    >
      <div className="auth-narrow">
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            step === 1 ? handleSendOTP() : handleResetPassword();
          }}
        >
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <i className="input-left"><MailIcon /></i>
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
              <div className="form-group">
                <label className="form-label">Email OTP</label>
                <div className="input-wrapper">
                  <i className="input-left"><HashIcon /></i>
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

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <i className="input-left"><LockIcon /></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <i
                    className="input-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </i>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <i className="input-left"><LockIcon /></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <i
                    className="input-right"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </i>
                </div>
              </div>
            </>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? (step === 1 ? 'Sending...' : 'Resetting...') : step === 1 ? 'Send OTP' : 'Reset Password'}
          </button>
        </form>

        <div className="or-divider">
          <span className="or-circle">OR</span>
        </div>

        <div className="auth-action-row">
          {step === 2 && (
            <button
              type="button"
              className="create-btn"
              onClick={() => setStep(1)}
            >
              Back to Email
            </button>
          )}
          <button type="button" className="create-btn" onClick={onBack}>
            Back to Login
          </button>
        </div>

        <AuthNotice icon={<ShieldIcon />}>
          Reset your password securely using email OTP verification before returning to your account.
        </AuthNotice>
      </div>
    </AuthFrame>
  );
}
