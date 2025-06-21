// File: pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/utils/AuthContext';
import soundManager from '@/utils/soundUtils';
import Icon from '@/components/FontAwesome';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      // Play success sound on successful login
      // soundManager.playAction();
      soundManager.playLogin();
    } catch (err) {
      setError(err.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (type) => {
    const demoAccounts = {
      admin: { email: 'admin@umrahfi.com', password: 'password123' },
      company: { email: 'info@almadinahtravel.com', password: 'password123' },
      customer: { email: 'ahmed@example.com', password: 'password123' }
    };
    
    // Play sound when demo account is selected
    soundManager.playAction(0.3); // Lower volume for less important action
    setFormData(demoAccounts[type]);
  };

  return (
    <Layout>
      <div className="login-auth-container">
        <div className="login-auth-background">
          <div className="login-auth-pattern"></div>
          <div className="login-auth-gradient"></div>
        </div>
        
        <div className="login-auth-content">
          <div className="login-auth-form-wrapper">
            <div className="login-auth-header">
              <div className="login-auth-icon">
                <Icon icon="kaaba" className="login-auth-icon-symbol" />
              </div>
              <h1 className="login-auth-title">Welcome Back</h1>
              <p className="login-auth-subtitle">
                Sign in to your account to continue your spiritual journey
              </p>
            </div>

            <div className="login-auth-card">
              {error && (
                <div className="login-auth-error">
                  <div className="login-error-icon">
                    <Icon icon="exclamation-triangle" />
                  </div>
                  <span className="login-error-text">{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="login-auth-form">
                <div className="login-form-group-modern">
                  <label className="login-form-label-modern">
                    <span className="login-label-text">Email Address</span>
                    <span className="login-label-required">*</span>
                  </label>
                  <div className="login-input-wrapper-modern">
                    <div className="login-input-icon">
                      <Icon icon="envelope" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="login-form-input-modern"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="login-form-group-modern">
                  <label className="login-form-label-modern">
                    <span className="login-label-text">Password</span>
                    <span className="login-label-required">*</span>
                  </label>
                  <div className="login-input-wrapper-modern">
                    <div className="login-input-icon">
                      <Icon icon="lock" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="login-form-input-modern"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon icon={showPassword ? "eye-slash" : "eye"} />
                    </button>
                  </div>
                </div>

                <div className="login-auth-actions">
                  <Link href="/forgot-password" className="login-forgot-link">
                    Forgot your password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="login-btn-auth-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="login-btn-loading">
                      <Icon icon="spinner" spin className="login-loading-spinner-auth" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="login-btn-content">
                      <span>Sign In</span>
                      <Icon icon="arrow-right" className="login-btn-arrow" />
                    </div>
                  )}
                </button>
              </form>

              <div className="login-auth-divider">
                <span>Don't have an account?</span>
              </div>

              <Link href="/register" className="login-btn-auth-secondary">
                <span>Create Account</span>
                <Icon icon="user-plus" className="login-btn-icon" />
              </Link>
            </div>

            {/* Demo accounts */}
            <div className="login-demo-accounts">
              <div className="login-demo-header">
                <div className="login-demo-icon">
                  <Icon icon="info-circle" />
                </div>
                <h3 className="login-demo-title">Demo Accounts</h3>
                <p className="login-demo-subtitle">Click to auto-fill credentials</p>
              </div>
              
              <div className="login-demo-grid">
                <button
                  type="button"
                  className="login-demo-account"
                  onClick={() => fillDemoAccount('admin')}
                >
                  <div className="login-demo-role-icon admin">
                    <Icon icon="user-tie" />
                  </div>
                  <div className="login-demo-info">
                    <div className="login-demo-role">Admin</div>
                    <div className="login-demo-email">admin@umrahfi.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="login-demo-account"
                  onClick={() => fillDemoAccount('company')}
                >
                  <div className="login-demo-role-icon company">
                    <Icon icon="building" />
                  </div>
                  <div className="login-demo-info">
                    <div className="login-demo-role">Travel Company</div>
                    <div className="login-demo-email">info@almadinahtravel.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="login-demo-account"
                  onClick={() => fillDemoAccount('customer')}
                >
                  <div className="login-demo-role-icon customer">
                    <Icon icon="user" />
                  </div>
                  <div className="login-demo-info">
                    <div className="login-demo-role">Customer</div>
                    <div className="login-demo-email">ahmed@example.com</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="login-auth-visual">
            <div className="login-visual-content">
              <div className="login-visual-icon">
                <Icon icon="kaaba" />
              </div>
              <h2 className="login-visual-title">
                Begin Your Sacred Journey
              </h2>
              <p className="login-visual-description">
                Join thousands of pilgrims who trust Umrahfi for their 
                spiritual journey to the holy cities.
              </p>
              <div className="login-visual-stats">
                <div className="login-stat-item">
                  <span className="login-stat-number">10K+</span>
                  <span className="login-stat-label">Happy Pilgrims</span>
                </div>
                <div className="login-stat-item">
                  <span className="login-stat-number">50+</span>
                  <span className="login-stat-label">Trusted Partners</span>
                </div>
                <div className="login-stat-item">
                  
                  <span className="login-stat-number">4.9<Icon icon="star" /></span>
                  <span className="login-stat-label">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}