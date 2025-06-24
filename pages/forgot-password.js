import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Icon from '@/components/FontAwesome';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="forgot-password-container">
        <div className="forgot-password-background">
          <div className="forgot-password-pattern"></div>
          <div className="forgot-password-gradient"></div>
        </div>
        
        <div className="forgot-password-content">
          <div className="forgot-password-form-wrapper">
            <div className="forgot-password-header">
              <div className="forgot-password-icon">
                <Icon icon="key" />
              </div>
              <h1 className="forgot-password-title">
                {sent ? 'Check Your Email' : 'Forgot Password?'}
              </h1>
              <p className="forgot-password-subtitle">
                {sent 
                  ? `We've sent a password reset link to ${email}`
                  : 'No worries, we\'ll send you reset instructions.'
                }
              </p>
            </div>

            <div className="forgot-password-card">
              {!sent ? (
                <>
                  {error && (
                    <div className="forgot-password-error">
                      <div className="forgot-password-error-icon">
                        <Icon icon="exclamation-circle" />
                      </div>
                      <span className="forgot-password-error-text">{error}</span>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="forgot-password-form-group">
                      <label className="forgot-password-form-label">
                        <span className="forgot-password-label-text">Email Address</span>
                        <span className="forgot-password-label-required">*</span>
                      </label>
                      <div className="forgot-password-input-wrapper">
                        <div className="forgot-password-input-icon">
                          <Icon icon="envelope" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="forgot-password-form-input"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="forgot-password-btn-primary" 
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <div className="forgot-password-btn-loading">
                          <div className="forgot-password-loading-spinner"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="forgot-password-btn-content">
                          <span>Send Reset Link</span>
                          <Icon icon="envelope" className="forgot-password-btn-icon" />
                        </div>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="forgot-password-success">
                  <div className="forgot-password-success-icon">
                    <Icon icon="check-circle" />
                  </div>
                  <div className="forgot-password-success-content">
                    <h3>Email Sent Successfully!</h3>
                    <p>Please check your email and click the reset link to set a new password.</p>
                    <div className="forgot-password-success-note">
                      <Icon icon="info-circle" />
                      <span>Didn't receive the email? Check your spam folder or try again.</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                    className="forgot-password-btn-secondary"
                  >
                    <Icon icon="arrow-left" />
                    <span>Send Another Email</span>
                  </button>
                </div>
              )}

              <div className="forgot-password-divider">
                <span>Remember your password?</span>
              </div>

              <Link href="/login" className="forgot-password-btn-secondary">
                <Icon icon="sign-in-alt" className="forgot-password-btn-icon" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>

          <div className="forgot-password-visual">
            <div className="forgot-password-visual-content">
              <div className="forgot-password-visual-icon">
                <Icon icon="shield-alt" />
              </div>
              <h2 className="forgot-password-visual-title">
                Secure Password Reset
              </h2>
              <p className="forgot-password-visual-description">
                Your security is our priority. We use encrypted links that expire quickly 
                to ensure your account stays safe.
              </p>
              <div className="forgot-password-visual-features">
                <div className="forgot-password-feature-item">
                  <div className="forgot-password-feature-icon">
                    <Icon icon="clock" />
                  </div>
                  <span>Reset links expire in 15 minutes</span>
                </div>
                <div className="forgot-password-feature-item">
                  <div className="forgot-password-feature-icon">
                    <Icon icon="lock" />
                  </div>
                  <span>Encrypted and secure process</span>
                </div>
                <div className="forgot-password-feature-item">
                  <div className="forgot-password-feature-icon">
                    <Icon icon="shield-alt" />
                  </div>
                  <span>No personal data exposed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}