import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  AuthDivider,
  AuthFrame,
  AuthNotice,
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
    <AuthFrame
      title="Create Account"
      subtitle="Verify your email before creating your account"
      icon={<UserPlusIcon />}
    >
      <div className="auth-narrow">
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <p className="sec-lbl">Register As</p>
        <div className="reg-grid">
          {supportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`reg-card ${option.value === 'application' ? 'rc-as' : ''} ${option.value === 'both' ? 'rc-bs' : ''} ${supportType === option.value ? 'sel' : ''}`}
              onClick={() => setSupportType(option.value)}
              disabled={loading}
            >
              <span className="reg-badge">{'\u2713'}</span>
              <span className="reg-ico">{option.icon}</span>
              <span className="reg-nm">{option.title}</span>
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); otpSent ? handleRegister() : handleSendOtp(); }}>
          <div className="form-group">
            <label className="form-label">Full Name (Optional)</label>
            <div className="input-wrapper">
              <i className="input-left"><UserIcon /></i>
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

          <div className="form-group">
            <label className="form-label">Email Address <span className="r">*</span></label>
            <div className="input-wrapper">
              <i className="input-left"><MailIcon /></i>
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

          <div className="form-group">
            <label className="form-label">Password (min 6 characters) <span className="r">*</span></label>
            <div className="input-wrapper">
              <i className="input-left"><LockIcon /></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            <label className="form-label">Confirm Password <span className="r">*</span></label>
            <div className="input-wrapper">
              <i className="input-left"><LockIcon /></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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

          {otpSent && (
            <div className="form-group auth-otp-row">
              <label className="form-label">Email OTP <span className="r">*</span></label>
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
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            <SendIcon />
            {loading ? (otpSent ? 'Verifying...' : 'Sending...') : otpSent ? 'Verify OTP & Create Account' : 'Send OTP'}
          </button>
        </form>

        <div className="or-divider">
          <span className="or-circle">OR</span>
        </div>

        <button type="button" className="create-btn" onClick={onBack}>
          Back to Login
        </button>

        <AuthNotice icon={<ShieldIcon />}>
          Your account will be created only after email OTP verification and then sent for admin approval.
        </AuthNotice>
      </div>
    </AuthFrame>
  );
}
