import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Icon from '@/components/FontAwesome';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setTokenValid(response.ok);
      
      if (!response.ok) {
        setError(data.error || 'Invalid or expired reset token');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to verify reset token');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 'none', text: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return { strength: 'weak', text: 'Weak', color: 'var(--error)' };
    if (score < 5) return { strength: 'medium', text: 'Medium', color: 'var(--warning)' };
    return { strength: 'strong', text: 'Strong', color: 'var(--success)' };
  };

  if (tokenValid === null) {
    return (
      <Layout>
        <div className="reset-password-container">
          <div className="reset-password-loading">
            <div className="reset-password-loading-spinner"></div>
            <span>Verifying reset token...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (tokenValid === false) {
    return (
      <Layout>
        <div className="reset-password-container">
          <div className="reset-password-content">
            <div className="reset-password-form-wrapper">
              <div className="reset-password-header">
                <div className="reset-password-icon error">
                  <Icon icon="exclamation-triangle" />
                </div>
                <h1 className="reset-password-title">Invalid Reset Link</h1>
                <p className="reset-password-subtitle">
                  This password reset link is invalid or has expired.
                </p>
              </div>

              <div className="reset-password-card">
                <div className="reset-password-error">
                  <div className="reset-password-error-icon">
                    <Icon icon="exclamation-circle" />
                  </div>
                  <span className="reset-password-error-text">{error}</span>
                </div>

                <Link href="/forgot-password" className="reset-password-btn-primary">
                  <Icon icon="key" className="reset-password-btn-icon" />
                  <span>Request New Reset Link</span>
                </Link>

                <div className="reset-password-divider">
                  <span>Or</span>
                </div>

                <Link href="/login" className="reset-password-btn-secondary">
                  <Icon icon="sign-in-alt" className="reset-password-btn-icon" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reset-password-container">
        <div className="reset-password-background">
          <div className="reset-password-pattern"></div>
          <div className="reset-password-gradient"></div>
        </div>
        
        <div className="reset-password-content">
          <div className="reset-password-form-wrapper">
            <div className="reset-password-header">
              <div className="reset-password-icon">
                <Icon icon={success ? "check-circle" : "lock"} />
              </div>
              <h1 className="reset-password-title">
                {success ? 'Password Reset Successful!' : 'Set New Password'}
              </h1>
              <p className="reset-password-subtitle">
                {success 
                  ? 'Your password has been successfully updated. You can now sign in with your new password.'
                  : 'Enter your new password below. Make sure it\'s strong and secure.'
                }
              </p>
            </div>

            <div className="reset-password-card">
              {!success ? (
                <>
                  {error && (
                    <div className="reset-password-error">
                      <div className="reset-password-error-icon">
                        <Icon icon="exclamation-circle" />
                      </div>
                      <span className="reset-password-error-text">{error}</span>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="reset-password-form-group">
                      <label className="reset-password-form-label">
                        <span className="reset-password-label-text">New Password</span>
                        <span className="reset-password-label-required">*</span>
                      </label>
                      <div className="reset-password-input-wrapper">
                        <div className="reset-password-input-icon">
                          <Icon icon="lock" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="reset-password-form-input"
                          placeholder="Enter your new password"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="reset-password-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Icon icon={showPassword ? "eye-slash" : "eye"} />
                        </button>
                      </div>
                      {formData.password && (
                        <div className="reset-password-password-strength">
                          <div className="reset-password-strength-bar">
                            <div 
                              className={`reset-password-strength-fill ${getPasswordStrength().strength}`}
                              style={{ backgroundColor: getPasswordStrength().color }}
                            ></div>
                          </div>
                          <div className="reset-password-strength-text">
                            Password strength: <span style={{ color: getPasswordStrength().color }}>
                              {getPasswordStrength().text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="reset-password-form-group">
                      <label className="reset-password-form-label">
                        <span className="reset-password-label-text">Confirm New Password</span>
                        <span className="reset-password-label-required">*</span>
                      </label>
                      <div className="reset-password-input-wrapper">
                        <div className="reset-password-input-icon">
                          <Icon icon="lock" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="reset-password-form-input"
                          placeholder="Confirm your new password"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="reset-password-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Icon icon={showConfirmPassword ? "eye-slash" : "eye"} />
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="reset-password-password-error">
                          <Icon icon="exclamation-circle" />
                          <span>Passwords do not match</span>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="reset-password-btn-primary" 
                      disabled={loading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                    >
                      {loading ? (
                        <div className="reset-password-btn-loading">
                          <div className="reset-password-loading-spinner"></div>
                          <span>Updating Password...</span>
                        </div>
                      ) : (
                        <div className="reset-password-btn-content">
                          <span>Update Password</span>
                          <Icon icon="check" className="reset-password-btn-icon" />
                        </div>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="reset-password-success">
                  <div className="reset-password-success-icon">
                    <Icon icon="check-circle" />
                  </div>
                  <div className="reset-password-success-content">
                    <h3>Password Updated Successfully!</h3>
                    <p>Your password has been changed. You can now sign in with your new password.</p>
                  </div>
                  <Link href="/login" className="reset-password-btn-primary">
                    <Icon icon="sign-in-alt" />
                    <span>Sign In Now</span>
                  </Link>
                </div>
              )}

              {!success && (
                <>
                  <div className="reset-password-divider">
                    <span>Remember your password?</span>
                  </div>

                  <Link href="/login" className="reset-password-btn-secondary">
                    <Icon icon="sign-in-alt" className="reset-password-btn-icon" />
                    <span>Back to Sign In</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="reset-password-visual">
            <div className="reset-password-visual-content">
              <div className="reset-password-visual-icon">
                <Icon icon="shield-alt" />
              </div>
              <h2 className="reset-password-visual-title">
                Secure Your Account
              </h2>
              <p className="reset-password-visual-description">
                Create a strong password to keep your account safe. Use a mix of letters, 
                numbers, and symbols for the best security.
              </p>
              <div className="reset-password-visual-features">
                <div className="reset-password-feature-item">
                  <div className="reset-password-feature-icon">
                    <Icon icon="check" />
                  </div>
                  <span>At least 8 characters long</span>
                </div>
                <div className="reset-password-feature-item">
                  <div className="reset-password-feature-icon">
                    <Icon icon="check" />
                  </div>
                  <span>Mix of uppercase and lowercase</span>
                </div>
                <div className="reset-password-feature-item">
                  <div className="reset-password-feature-icon">
                    <Icon icon="check" />
                  </div>
                  <span>Include numbers and symbols</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}