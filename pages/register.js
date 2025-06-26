// File: pages/register.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';

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
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First register the user
      const registeredUser = await register({
        ...formData,
        role: userType
      });

      // If profile picture is selected, upload it
      if (profilePicture && registeredUser) {
        setUploadingPicture(true);
        const formDataUpload = new FormData();
        formDataUpload.append('profilePicture', profilePicture);

        try {
          await fetch('/api/auth/upload-profile-picture', {
            method: 'POST',
            body: formDataUpload
          });
        } catch (uploadErr) {
          console.error('Profile picture upload failed:', uploadErr);
          // Don't fail registration if profile picture upload fails
        } finally {
          setUploadingPicture(false);
        }
      }
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
                <Icon icon={['fas', 'star']} className="register-auth-icon-symbol" />
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
                        <Icon icon="user" />
                      </div>
                      <div className="register-user-type-info">
                        <div className="register-user-type-title">Pilgrim</div>
                        <div className="register-user-type-desc">I want to book Umrah packages</div>
                      </div>
                      <div className="register-user-type-check">
                        <Icon icon="check" />
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
                        <Icon icon="building" />
                      </div>
                      <div className="register-user-type-info">
                        <div className="register-user-type-title">Travel Agency</div>
                        <div className="register-user-type-desc">I want to offer Umrah packages</div>
                      </div>
                      <div className="register-user-type-check">
                        <Icon icon="check" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="register-auth-error">
                  <div className="register-error-icon">
                    <Icon icon="exclamation-circle" />
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
                          <Icon icon="user" />
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

                    {/* Profile Picture Upload */}
                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Profile Picture</span>
                      </label>
                      <div className="register-profile-picture-section">
                        <div className="register-profile-picture-preview">
                          {profilePicturePreview ? (
                            <div className="register-preview-container">
                              <img 
                                src={profilePicturePreview} 
                                alt="Profile preview" 
                                className="register-preview-image"
                              />
                              <button
                                type="button"
                                onClick={removeProfilePicture}
                                className="register-remove-picture-btn"
                              >
                                <Icon icon="times" />
                              </button>
                            </div>
                          ) : (
                            <div className="register-preview-placeholder">
                              <Icon icon="camera" />
                              <span>Upload Photo</span>
                            </div>
                          )}
                        </div>
                        <div className="register-profile-picture-controls">
                          <label className="register-upload-btn">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="register-file-input"
                            />
                            <Icon icon="upload" />
                            <span>{profilePicturePreview ? 'Change Photo' : 'Choose Photo'}</span>
                          </label>
                          <p className="register-upload-hint">
                            Optional. JPG, PNG or GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="register-form-group-modern">
                      <label className="register-form-label-modern">
                        <span className="register-label-text">Email Address</span>
                        <span className="register-label-required">*</span>
                      </label>
                      <div className="register-input-wrapper-modern">
                        <div className="register-input-icon">
                          <Icon icon="envelope" />
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
                          <Icon icon="lock" />
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
                          <Icon icon={showPassword ? "eye-slash" : "eye"} />
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
                            <Icon icon="phone" />
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
                            <Icon icon="map-marker-alt" />
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
                          <Icon icon="building" />
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
                          <Icon icon="file-alt" />
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
                          <Icon icon="map-marker-alt" />
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
                      <Icon icon="arrow-left" className="register-btn-icon" />
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
                      <Icon icon="arrow-right" className="register-btn-arrow" />
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
                          <Icon icon="user-plus" className="register-btn-arrow" />
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
                <Icon icon="sign-in-alt" className="register-btn-icon" />
              </Link>
            </div>
          </div>

          <div className="register-auth-visual">
            <div className="register-visual-content">
              <div className="register-visual-icon">
                <Icon icon={['fas', 'star']} />
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
                    <Icon icon="check" />
                  </div>
                  <span>Instant booking confirmation</span>
                </div>
                <div className="register-feature-item">
                  <div className="register-feature-icon">
                    <Icon icon="check" />
                  </div>
                  <span>24/7 customer support</span>
                </div>
                <div className="register-feature-item">
                  <div className="register-feature-icon">
                    <Icon icon="check" />
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