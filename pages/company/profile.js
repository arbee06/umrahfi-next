import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../utils/AuthContext';
import authService from '../../services/authService';
import { getCountries } from '../../utils/countries';
import Swal from 'sweetalert2';
import soundManager from '../../utils/soundUtils';
import Icon from '../../components/FontAwesome';

export default function CompanyProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  
  // Country dropdown states
  const [countries] = useState(() => getCountries());
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(getCountries());
  const countryDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    companyLicense: '',
    companyAddress: '',
    country: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolderName: '',
    bankRoutingNumber: '',
    bankSwiftCode: '',
    bankAddress: '',
    // Payment Configuration
    preferredPaymentMethods: ['stripe', 'bank_transfer'],
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    paymentProcessingFee: 2.9,
    acceptCashPayments: true,
    acceptBankTransfers: true
  });

  useEffect(() => {
    if (user) {
      // Populate form with user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      companyName: user.companyName || '',
      companyLicense: user.companyLicense || '',
      companyAddress: user.companyAddress || '',
      country: user.country || '',
      bankName: user.bankName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankAccountHolderName: user.bankAccountHolderName || '',
      bankRoutingNumber: user.bankRoutingNumber || '',
      bankSwiftCode: user.bankSwiftCode || '',
      bankAddress: user.bankAddress || '',
      // Payment Configuration
      preferredPaymentMethods: user.preferredPaymentMethods || ['stripe', 'bank_transfer'],
      stripePublishableKey: user.stripePublishableKey || '',
      stripeSecretKey: user.stripeSecretKey || '',
      stripeWebhookSecret: user.stripeWebhookSecret || '',
      paymentProcessingFee: user.paymentProcessingFee || 2.9,
      acceptCashPayments: user.acceptCashPayments !== false,
      acceptBankTransfers: user.acceptBankTransfers !== false
    });
    }
  }, [user]);

  // Country dropdown effects
  useEffect(() => {
    const filtered = countries.filter(country =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [countrySearch, countries]);

  useEffect(() => {
    if (formData.country && !isCountryOpen) {
      setCountrySearch(formData.country);
    }
  }, [formData.country, isCountryOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Country dropdown handlers
  const handleCountryInputChange = (e) => {
    setCountrySearch(e.target.value);
    if (!isCountryOpen) setIsCountryOpen(true);
  };

  const handleCountryInputFocus = () => {
    setIsCountryOpen(true);
    setCountrySearch('');
  };

  const handleCountrySelect = (country) => {
    setFormData({
      ...formData,
      country: country.name
    });
    setCountrySearch(country.name);
    setIsCountryOpen(false);
  };

  // Payment methods handlers
  const handlePaymentMethodChange = (method) => {
    if (method === 'stripe') {
      // If stripe is being enabled and not already configured, show modal
      if (!formData.preferredPaymentMethods.includes(method)) {
        setFormData(prev => ({
          ...prev,
          preferredPaymentMethods: [...prev.preferredPaymentMethods, method]
        }));
        setShowStripeModal(true);
      } else {
        // If stripe is being disabled, just remove it
        setFormData(prev => ({
          ...prev,
          preferredPaymentMethods: prev.preferredPaymentMethods.filter(m => m !== method)
        }));
      }
    } else {
      // For other payment methods, toggle normally
      setFormData(prev => {
        const methods = [...prev.preferredPaymentMethods];
        if (methods.includes(method)) {
          return {
            ...prev,
            preferredPaymentMethods: methods.filter(m => m !== method)
          };
        } else {
          return {
            ...prev,
            preferredPaymentMethods: [...methods, method]
          };
        }
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const testStripeConnection = async () => {
    if (!formData.stripeSecretKey) {
      Swal.fire({
        title: 'Missing Configuration',
        text: 'Please enter your Stripe secret key to test the connection.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      const response = await fetch('/api/company/test-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripeSecretKey: formData.stripeSecretKey
        }),
      });

      const result = await response.json();

      if (result.success) {
        soundManager.playLogin();
        Swal.fire({
          title: 'Connection Successful!',
          html: `
            <div style="text-align: left; margin: 1rem 0;">
              <p><strong>Account:</strong> ${result.account.display_name || result.account.id}</p>
              <p><strong>Country:</strong> ${result.account.country}</p>
              <p><strong>Currency:</strong> ${result.account.default_currency?.toUpperCase()}</p>
              <p><strong>Status:</strong> ${result.account.charges_enabled ? 'Active' : 'Pending'}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#059669'
        });
      } else {
        throw new Error(result.error || 'Failed to connect to Stripe');
      }
    } catch (error) {
      console.error('Stripe test error:', error);
      soundManager.playAction();
      Swal.fire({
        title: 'Connection Failed',
        text: error.message || 'Failed to connect to Stripe. Please check your API key.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Show loading state
    Swal.fire({
      title: 'Updating Company Profile...',
      html: 'Please wait while we update your company information.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        popup: 'custom-swal-popup'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      
      // Show success message with sound
      soundManager.playLogin(); // Success sound
      await Swal.fire({
        title: 'Company Profile Updated!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">Your company profile has been successfully updated!</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Company:</p>
            <p style="font-weight: 600; color: #1f2937;">${formData.companyName}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Go to Dashboard',
        timer: 3000,
        timerProgressBar: true
      });

      // Redirect to company dashboard
      router.push('/company');
      
    } catch (error) {
      Swal.close();
      
      // Show error message
      await Swal.fire({
        title: 'Update Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">${error.message}</p>
            <p style="color: #6b7280; font-size: 0.9rem;">Please check your information and try again.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Try Again'
      });
      
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPicture(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile picture');
      }

      // Update user context with new profile picture
      setUser({ ...user, profilePicture: data.profilePicture });
      
      // Show success toast with sound
      soundManager.playAction(); // Action success sound
      Swal.fire({
        title: 'Company Logo Updated!',
        text: 'Your company logo has been updated successfully',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      
    } catch (error) {
      // Show error toast
      Swal.fire({
        title: 'Upload Failed',
        text: error.message,
        icon: 'error',
        timer: 4000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="company-profile-container">
          {/* Header with Company Logo */}
          <div className="company-profile-header">
            <div className="company-profile-header-content">
              <div className="company-profile-header-text">
                <div className="company-profile-welcome-badge">
                  <Icon icon={['fas', 'building']} className="company-profile-badge-icon" />
                  <span className="company-profile-badge-text">Company Profile</span>
                </div>
                <h1 className="company-profile-header-title">
                  Welcome, <span className="company-profile-company-name">{user?.companyName || user?.name}</span>
                </h1>
                <p className="company-profile-header-subtitle">
                  Manage your company information and settings to build trust with customers
                </p>
              </div>
              <div className="company-profile-header-actions">
                <div className="company-profile-avatar-section">
                  <img
                    src={user?.profilePicture || '/images/default-profile.svg'}
                    alt="Company Logo"
                    className="company-profile-avatar"
                  />
                  <label className="company-profile-upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      disabled={uploadingPicture}
                    />
                    {uploadingPicture ? (
                      <>
                        <Icon icon={['fas', 'spinner']} spin />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Icon icon={['fas', 'image']} />
                        Change Logo
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <div className={`company-profile-alert company-profile-alert-${message.type}`}>
              <Icon icon={['fas', message.type === 'success' ? 'check-circle' : 'exclamation-triangle']} />
              {message.text}
            </div>
          )}

          {/* Info Banner */}
          <div className="company-profile-info-banner">
            <Icon icon={['fas', 'info-circle']} className="company-profile-info-icon" />
            Keep your company information up to date to build trust with customers
          </div>

          {/* Form */}
          <div className="company-profile-form">
            <form onSubmit={handleSubmit}>
              {/* Contact Person Information Section */}
              <div className="company-profile-form-section">
                <div className="company-profile-section-header">
                  <Icon icon={['fas', 'user-tie']} className="company-profile-section-icon" />
                  <h2 className="company-profile-section-title">Contact Person Information</h2>
                </div>
                
                <div className="company-profile-form-grid">
                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Contact Person Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="company-profile-form-input"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="+966 55 123 4567"
                    />
                  </div>
                </div>

                <div className="company-profile-form-group">
                  <label className="company-profile-form-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="company-profile-form-input company-profile-disabled-input"
                    placeholder="company@example.com"
                  />
                  <small className="company-profile-form-help">
                    <Icon icon={['fas', 'info-circle']} />
                    Email address cannot be changed for security reasons
                  </small>
                </div>

                <div className="company-profile-form-group company-profile-form-grid-full">
                  <label className="company-profile-form-label">Personal Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="company-profile-form-textarea"
                    placeholder="Enter personal address"
                  />
                </div>
              </div>

              {/* Company Information Section */}
              <div className="company-profile-form-section">
                <div className="company-profile-section-header">
                  <Icon icon={['fas', 'building']} className="company-profile-section-icon" />
                  <h2 className="company-profile-section-title">Company Information</h2>
                </div>
                
                <div className="company-profile-form-grid three-columns">
                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="company-profile-form-input"
                      placeholder="Company Name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">License Number</label>
                    <input
                      type="text"
                      name="companyLicense"
                      value={formData.companyLicense}
                      onChange={handleChange}
                      required
                      className="company-profile-form-input"
                      placeholder="License Number"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Country</label>
                    <div className="country-select" ref={countryDropdownRef}>
                      <div className="country-select-input-wrapper">
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={handleCountryInputChange}
                          onFocus={handleCountryInputFocus}
                          placeholder="Select your country"
                          required
                          className="company-profile-form-input"
                        />
                        <div 
                          className={`country-select-arrow ${isCountryOpen ? 'open' : ''}`}
                          onClick={() => setIsCountryOpen(!isCountryOpen)}
                        >
                          <Icon icon="chevron-down" />
                        </div>
                      </div>
                      
                      {isCountryOpen && (
                        <div className="country-select-dropdown">
                          {filteredCountries.length > 0 ? (
                            <div className="country-select-options">
                              {filteredCountries.map((country) => (
                                <div
                                  key={country.code}
                                  className={`country-select-option ${formData.country === country.name ? 'selected' : ''}`}
                                  onClick={() => handleCountrySelect(country)}
                                >
                                  <span className="country-name">{country.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="country-select-no-results">
                              <Icon icon="search" />
                              <span>No countries found for "{countrySearch}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="company-profile-form-group company-profile-form-grid-full">
                  <label className="company-profile-form-label">Company Address</label>
                  <textarea
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    rows="3"
                    required
                    className="company-profile-form-textarea"
                    placeholder="Enter company address"
                  />
                </div>
              </div>


              {/* Payment Configuration Section */}
              <div className="company-profile-form-section">
                <div className="company-profile-section-header">
                  <Icon icon={['fas', 'credit-card']} className="company-profile-section-icon" />
                  <h2 className="company-profile-section-title">Payment Configuration</h2>
                  <p className="company-profile-section-subtitle">Configure your preferred payment methods and Stripe integration</p>
                </div>

                {/* Payment Methods */}
                <div className="company-profile-payment-methods">
                  <p className="company-profile-subsection-description">Select which payment methods you want to accept from customers</p>
                  
                  <div className="company-profile-payment-grid">
                    <label className="company-profile-payment-option">
                      <input
                        type="checkbox"
                        checked={formData.preferredPaymentMethods.includes('stripe')}
                        onChange={() => handlePaymentMethodChange('stripe')}
                      />
                      <div className="company-profile-payment-card">
                        <div className="shimmer-overlay"></div>
                        <Icon icon={['fas', 'credit-card']} />
                        <div className="payment-card-content">
                          <span>Stripe (Credit/Debit Cards)</span>
                          <small>Online card payments with instant processing</small>
                        </div>
                        {formData.preferredPaymentMethods.includes('stripe') && (
                          <button 
                            type="button"
                            className="company-profile-config-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStripeModal(true);
                            }}
                          >
                            <Icon icon={['fas', 'cog']} />
                          </button>
                        )}
                      </div>
                    </label>

                    <label className="company-profile-payment-option">
                      <input
                        type="checkbox"
                        checked={formData.acceptBankTransfers}
                        onChange={handleCheckboxChange}
                        name="acceptBankTransfers"
                      />
                      <div className="company-profile-payment-card">
                        <div className="shimmer-overlay"></div>
                        <Icon icon={['fas', 'credit-card']} />
                        <div className="payment-card-content">
                          <span>Bank Transfer</span>
                          <small>Direct bank to bank transfers</small>
                        </div>
                        {formData.acceptBankTransfers && (
                          <button 
                            type="button"
                            className="company-profile-config-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBankModal(true);
                            }}
                          >
                            <Icon icon={['fas', 'cog']} />
                          </button>
                        )}
                      </div>
                    </label>

                    <label className="company-profile-payment-option">
                      <input
                        type="checkbox"
                        checked={formData.acceptCashPayments}
                        onChange={handleCheckboxChange}
                        name="acceptCashPayments"
                      />
                      <div className="company-profile-payment-card">
                        <div className="shimmer-overlay"></div>
                        <Icon icon={['fas', 'money-bill-wave']} />
                        <div className="payment-card-content">
                          <span>Cash Payment</span>
                          <small>In-person cash transactions</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <div className="company-profile-form-section">
                <button
                  type="submit"
                  disabled={loading}
                  className="company-profile-submit-button"
                >
                  {loading ? (
                    <>
                      <Icon icon={['fas', 'spinner']} spin />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Icon icon={['fas', 'check']} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stripe Configuration Modal */}
        {showStripeModal && (
          <div className="company-profile-modal-overlay" onClick={() => setShowStripeModal(false)}>
            <div className="company-profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="company-profile-modal-header">
                <h3>
                  <Icon icon={['fab', 'stripe']} />
                  Configure Stripe Payment
                </h3>
                <button 
                  className="company-profile-modal-close"
                  onClick={() => setShowStripeModal(false)}
                >
                  <Icon icon={['fas', 'times']} />
                </button>
              </div>

              <div className="company-profile-modal-content">
                <p className="company-profile-modal-description">
                  Configure your Stripe API keys to accept credit and debit card payments securely.
                </p>

                <div className="company-profile-stripe-form">
                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'key']} />
                      Publishable Key
                    </label>
                    <input
                      type="text"
                      name="stripePublishableKey"
                      value={formData.stripePublishableKey}
                      onChange={handleChange}
                      placeholder="pk_live_... or pk_test_..."
                      className="company-profile-form-input company-profile-stripe-input"
                    />
                    <small className="company-profile-form-hint">Starts with pk_live_ (production) or pk_test_ (testing)</small>
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'lock']} />
                      Secret Key
                    </label>
                    <input
                      type="password"
                      name="stripeSecretKey"
                      value={formData.stripeSecretKey}
                      onChange={handleChange}
                      placeholder="sk_live_... or sk_test_..."
                      className="company-profile-form-input company-profile-stripe-input"
                    />
                    <small className="company-profile-form-hint">Starts with sk_live_ (production) or sk_test_ (testing)</small>
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'webhook']} />
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="password"
                      name="stripeWebhookSecret"
                      value={formData.stripeWebhookSecret}
                      onChange={handleChange}
                      placeholder="whsec_..."
                      className="company-profile-form-input company-profile-stripe-input"
                    />
                    <small className="company-profile-form-hint">For webhook endpoint verification (starts with whsec_)</small>
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'percentage']} />
                      Processing Fee (%)
                    </label>
                    <input
                      type="number"
                      name="paymentProcessingFee"
                      value={formData.paymentProcessingFee}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="company-profile-form-input company-profile-fee-input"
                    />
                    <small className="company-profile-form-hint">Additional fee to cover payment processing costs</small>
                  </div>
                </div>

                <div className="company-profile-modal-actions">
                  <button
                    type="button"
                    onClick={testStripeConnection}
                    className="company-profile-test-stripe-btn"
                    disabled={loading || !formData.stripeSecretKey}
                  >
                    <Icon icon={['fas', 'plug']} />
                    Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStripeModal(false)}
                    className="company-profile-modal-save-btn"
                  >
                    <Icon icon={['fas', 'check']} />
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Configuration Modal */}
        {showBankModal && (
          <div className="company-profile-modal-overlay" onClick={() => setShowBankModal(false)}>
            <div className="company-profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="company-profile-modal-header">
                <h3>
                  <Icon icon={['fas', 'building-columns']} />
                  Bank Account Information
                </h3>
                <button 
                  className="company-profile-modal-close"
                  onClick={() => setShowBankModal(false)}
                >
                  <Icon icon={['fas', 'times']} />
                </button>
              </div>

              <div className="company-profile-modal-content">
                <p className="company-profile-modal-description">
                  Configure your bank account details for receiving bank transfer payments.
                </p>

                <div className="company-profile-stripe-form">
                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'building-columns']} />
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="company-profile-form-input company-profile-stripe-input"
                      placeholder="Bank Name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'hashtag']} />
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      className="company-profile-form-input company-profile-stripe-input"
                      placeholder="Account Number"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'user']} />
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="bankAccountHolderName"
                      value={formData.bankAccountHolderName}
                      onChange={handleChange}
                      className="company-profile-form-input company-profile-stripe-input"
                      placeholder="Account Holder Name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'route']} />
                      Routing Number
                    </label>
                    <input
                      type="text"
                      name="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={handleChange}
                      className="company-profile-form-input company-profile-stripe-input"
                      placeholder="Routing Number"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'globe']} />
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      name="bankSwiftCode"
                      value={formData.bankSwiftCode}
                      onChange={handleChange}
                      className="company-profile-form-input company-profile-stripe-input"
                      placeholder="SWIFT Code"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">
                      <Icon icon={['fas', 'map-marker-alt']} />
                      Bank Address
                    </label>
                    <textarea
                      name="bankAddress"
                      value={formData.bankAddress}
                      onChange={handleChange}
                      rows="3"
                      className="company-profile-form-textarea"
                      placeholder="Bank Address"
                    />
                  </div>
                </div>

                <div className="company-profile-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="company-profile-modal-save-btn"
                  >
                    <Icon icon={['fas', 'check']} />
                    Save Bank Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}