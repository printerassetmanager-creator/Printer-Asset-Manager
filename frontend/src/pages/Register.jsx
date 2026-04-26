import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function Register({ onBack }) {
  const [supportType, setSupportType] = useState('technical');
  const [showAppDevModal, setShowAppDevModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      return 'Email, password, and confirm password are required';
    }

    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.sendRegistrationOtp(email);
      setOtpSent(true);
      setSuccess(response.data?.message || 'Verification OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(email, password, confirmPassword, fullName, otp.trim(), supportType);
      setSuccess(response.data?.message || 'Account created successfully');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (otpSent) {
      setOtpSent(false);
      setOtp('');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="logo-container">
            <img src="/jabil-logo.svg" alt="JABIL Logo" className="auth-logo" />
          </div>
          <h1>Create Account</h1>
          <p>Verify your email before creating your account</p>
        </div>

        <form onSubmit={otpSent ? handleRegister : handleSendOtp} className="auth-form">
          <div className="form-group">
            <label>Register As</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="supportType"
                  value="technical"
                  checked={supportType === 'technical'}
                  onChange={() => setSupportType('technical')}
                  disabled={loading}
                />
                Technical Support
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="supportType"
                  value="application"
                  checked={supportType === 'application'}
                  onChange={() => setSupportType('application')}
                  disabled={loading}
                />
                Application Support
              </label>
            </div>
          </div>

          {supportType === 'application' && (
            <div className="form-group">
              <div className="auth-info">
                <strong>Application Support</strong>
                <p>This section is currently under development.</p>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAppDevModal(true)}>
                  Learn more
                </button>
              </div>
            </div>
          )}

          {supportType === 'application' ? null : (
            <>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="form-group">
            <label>Full Name (Optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
            />
            {otpSent ? <small>If you change the email, a new OTP will be required.</small> : null}
          </div>

          <div className="form-group">
            <label>Password (min 6 characters) *</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Show' : 'Hide'}
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
                placeholder="Confirm password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Show' : 'Hide'}
              </button>
            </div>
          </div>

          {otpSent ? (
            <div className="form-group">
              <label>Email Verification OTP *</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit OTP"
                disabled={loading}
                maxLength={6}
                required
              />
              <small>Check your email inbox for the OTP. It is valid for 10 minutes.</small>
            </div>
          ) : null}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? otpSent
                ? 'Verifying OTP...'
                : 'Sending OTP...'
              : otpSent
                ? 'Verify OTP & Create Account'
                : 'Send OTP'}
          </button>

              {otpSent ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              ) : null}
            </>
          )}
        </form>

        {showAppDevModal && (
          <div className="auth-modal-backdrop" onClick={() => setShowAppDevModal(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Application Support</h3>
              <p>This section is currently under development. Please check back later.</p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => setShowAppDevModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <button type="button" className="btn btn-ghost" onClick={onBack} disabled={loading}>
            Back to Login
          </button>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Your account will be created only after email OTP verification and then sent for admin approval.
          </p>
        </div>
      </div>
    </div>
  );
}
