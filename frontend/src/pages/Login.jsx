import React, { useState } from 'react';
import {
  AuthDivider,
  AuthFrame,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LoginIcon,
  MailIcon,
  SendIcon,
  UserPlusIcon,
} from '../components/AuthFrame';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const response = await authAPI.login(trimmedEmail, password);
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome Back"
      subtitle="Login to continue to your account"
      icon={<LoginIcon />}
      accent="check"
    >
      <div className="auth-narrow">
        <div className="auth-form-shell">
          <div className={`auth-border-sparkle ${error ? 'auth-border-sparkle--error' : ''}`} />
          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <i className="input-left"><MailIcon /></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <i className="input-left"><LockIcon /></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
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

            <div className="options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a
                href="#"
                className="forgot"
                onClick={(e) => {
                  e.preventDefault();
                  onLoginSuccess({ screen: 'forgot-password' });
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="or-divider">
          <span className="or-circle">OR</span>
        </div>

        <button
          type="button"
          className="create-btn"
          onClick={() => onLoginSuccess({ screen: 'register' })}
        >
          Create Account
        </button>
      </div>
    </AuthFrame>
  );
}
