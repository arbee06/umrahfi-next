// File: pages/register.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/utils/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    companyName: '',
    companyLicense: '',
    companyAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (router.query.type) {
      setUserType(router.query.type);
    }
  }, [router.query.type]);

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
      await register({
        ...formData,
        role: userType
      });
    } catch (err) {
      setError(err.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (userType === 'company' && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStep1Valid = () => {
    return formData.name && formData.email && formData.password && formData.password.length >= 6;
  };

  // Reset to step 1 when switching user types
  useEffect(() => {
    setCurrentStep(1);
  }, [userType]);

  return (
    <Layout>
      <div className="register-auth-container">
        <div className="register-auth-background">
          <div className="register-auth-pattern"></div>
          <div className="register-auth-gradient"></div>
        </div>
        
        <div className="register-auth-content">
          <div className="register-auth-form-wrapper register">
            <div className="register-auth-header">
              <div className="register-auth-icon">
                <span className="register-auth-icon-symbol">🌟</span>
              </div>
              <h1 className="register-auth-title">Create Your Account</h1>
              <p className="register-auth-subtitle">
                Join Umrahfi and start your spiritual journey today
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="register-progress-indicator">
              <div className="register-progress-bar">
                <div 
                  className="register-progress-fill"
                  style={{ 
                    width: userType === 'company' 
                      ? `${(currentStep / 2) * 100}%` 
                      : '100%'
                  }}
                ></div>
              </div>
              <div className="register-progress-steps">
                <div className={`register-progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <span className="register-step-number">1</span>
                  <span className="register-step-label">Personal Info</span>
                </div>
                {userType === 'company' && (
                  <div className={`register-progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                    <span className="register-step-number">2</span>
                    <span className="register-step-label">Company Details</span>
                  </div>
                )}
              </div>
            </div>

            <div className="register-auth-card">
              {/* User Type Selection */}
              <div className="register-user-type-section">
                <h3 className="register-section-title">What describes you best?</h3>
                <div className="register-user-type-grid">
                  <label className={`register-user-type-option ${userType === 'customer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="customer"
                      checked={userType === 'customer'}
                      onChange={(e) => setUserType(e.target.value)}
                      className="register-user-type-input"
                    />
                    <div className="register-user-type-content">
                      <div className="register-user-type-icon customer">
                        <span>🧑</span>
                      </div>
                      <div className="register-user-type-info">
                        <div className="register-user-type-title">Pilgrim</div>
                        <div className="register-user-type-desc">I want to book Umrah packages</div>
                      </div>
                      <div className="register-user-type-check">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </label>

                  <label className={`register-user-type-option ${userType === 'company' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="company"
                      checked={userType === 'company'}
                      onChange={(e) => setUserType(e.target.value)}
                      className="register-user-type-input"
                    />
                    <div className="register-user-type-content">
                      <div className="register-user-type-icon company">
                        <span>🏢</span>
                      </div>
                      <div className="register-user-type-info">
                        <div className="register-user-type-title">Travel Agency</div>
                        <div className="register-user-type-desc">I want to offer Umrah packages</div>
                      </div>
                      <div className="register-user-type-check">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="register-auth-error">
                  <div className="register-error-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="register-error-text">{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="register-auth-form">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="register-form-step">
                    <h3 className="register-step-title">Personal Information</h3>
                    
                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Full Name</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="register-form-input-modern"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Email Address</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="register-form-input-modern"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Password</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="register-form-input-modern"
                          placeholder="Create a strong password"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="register-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="register-password-strength">
                        <div className="register-strength-text">
                          Password must be at least 6 characters long
                        </div>
                      </div>
                    </div>

                    <div className="register-form-row">
                      <div className="register-form-group-modern">
                        <label className="register-form-label-modern">
                          <span className="register-label-text">Phone Number</span>
                        </label>
                        <div className="register-input-wrapper-modern">
                          <div className="register-input-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="register-form-input-modern"
                            placeholder="Your phone number"
                          />
                        </div>
                      </div>

                      <div className="register-form-group-modern">
                        <label className="register-form-label-modern">
                          <span className="register-label-text">Location</span>
                        </label>
                        <div className="register-input-wrapper-modern">
                          <div className="register-input-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="register-form-input-modern"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Company Information (only for companies) */}
                {currentStep === 2 && userType === 'company' && (
                  <div className="register-form-step">
                    <h3 className="register-step-title">Company Information</h3>
                    
                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Company Name</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="register-form-input-modern"
                          placeholder="Your travel company name"
                          required
                        />
                      </div>
                    </div>

                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">License Number</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="companyLicense"
                          value={formData.companyLicense}
                          onChange={handleChange}
                          className="register-form-input-modern"
                          placeholder="Travel license/registration number"
                          required
                        />
                      </div>
                    </div>

                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Company Address</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <textarea
                          name="companyAddress"
                          value={formData.companyAddress}
                          onChange={handleChange}
                          className="register-form-textarea-modern"
                          rows="3"
                          placeholder="Complete business address with city and postal code"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Navigation */}
                <div className="register-form-navigation">
                  {currentStep > 1 && userType === 'company' && (
                    <button 
                      type="button" 
                      className="register-btn-auth-secondary"
                      onClick={prevStep}
                    >
                      <svg className="register-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      <span>Previous</span>
                    </button>
                  )}

                  {userType === 'company' && currentStep === 1 ? (
                    <button 
                      type="button" 
                      className="register-btn-auth-primary"
                      onClick={nextStep}
                      disabled={!isStep1Valid()}
                    >
                      <span>Continue</span>
                      <svg className="register-btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="register-btn-auth-primary" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="register-btn-loading">
                          <div className="register-loading-spinner-auth"></div>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        <div className="register-btn-content">
                          <span>Create Account</span>
                          <svg className="register-btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="register-auth-divider">
                <span>Already have an account?</span>
              </div>

              <Link href="/login" className="register-btn-auth-secondary">
                <span>Sign In</span>
                <svg className="register-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="register-auth-visual">
            <div className="register-visual-content">
              <div className="register-visual-icon">
                <span>🌟</span>
              </div>
              <h2 className="register-visual-title">
                Start Your Sacred Journey
              </h2>
              <p className="register-visual-description">
                Join our community of pilgrims and travel partners. 
                Experience seamless Umrah bookings and exceptional service.
              </p>
              <div className="register-visual-features">
                <div className="register-feature-item">
                  <div className="register-feature-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Instant booking confirmation</span>
                </div>
                <div className="register-feature-item">
                  <div className="register-feature-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>24/7 customer support</span>
                </div>
                <div className="register-feature-item">
                  <div className="register-feature-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Verified travel partners</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}