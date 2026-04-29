import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
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

  const handleCreateAccount = () => {
    onLoginSuccess({ screen: 'register' });
  };

  const handleForgotPassword = () => {
    onLoginSuccess({ screen: 'forgot-password' });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="logo-container">
            <img src="/jabil-logo.svg" alt="JABIL Logo" className="auth-logo" />
          </div>
          <h1>IT Support Activities</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <div className="auth-links">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot Password?
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleCreateAccount}
            disabled={loading}
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}
