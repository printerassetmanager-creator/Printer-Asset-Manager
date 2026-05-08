import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  EyeIcon,
  EyeOffIcon,
  HashIcon,
  HeadsetIcon,
  LockIcon,
  MailIcon,
  SendIcon,
  ShieldIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from '../components/AuthFrame';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function Register({ onBack }) {
  const [supportType, setSupportType] = useState('application');
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

  const supportOptions = [
    { value: 'technical', title: 'Technical Support', icon: <HeadsetIcon /> },
    { value: 'application', title: 'Application Support', icon: <BriefcaseIcon /> },
    { value: 'both', title: 'Both Support Types', icon: <UsersIcon /> },
  ];

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

  const handleSendOtp = async () => {
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

  const handleRegister = async () => {
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">JABIL</div>
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Verify your email before creating your account</p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <div className="support-options">
          {supportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`support-card ${supportType === option.value ? 'selected' : ''}`}
              onClick={() => setSupportType(option.value)}
              disabled={loading}
            >
              <span className="support-icon">{option.icon}</span>
              <span className="support-text">{option.title}</span>
            </button>
          ))}
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); otpSent ? handleRegister() : handleSendOtp(); }}>
          <div className="login-field">
            <label className="login-label">Full Name (Optional)</label>
            <div className="login-input">
              <span className="login-icon"><UserIcon /></span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Email Address</label>
            <div className="login-input">
              <span className="login-icon"><MailIcon /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input">
              <span className="login-icon"><LockIcon /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
                placeholder="Confirm your password"
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

          {otpSent && (
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
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (otpSent ? 'Verifying...' : 'Sending...') : otpSent ? 'Verify OTP & Create Account' : 'Send OTP'}
          </button>
        </form>

        <div className="login-footer">
          <button type="button" className="login-link" onClick={onBack}>
            <ArrowLeftIcon /> Back to Login
          </button>
        </div>

        <div className="auth-note">
          <span className="auth-note-icon"><ShieldIcon /></span>
          Your account will be created only after email OTP verification and then sent for admin approval.
        </div>
      </div>
    </div>
  );
}
