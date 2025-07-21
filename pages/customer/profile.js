// File: umrahfi-next/pages/customer/profile.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../utils/AuthContext';
import authService from '../../services/authService';
import CountrySelect from '../../components/CountrySelect';
import Swal from 'sweetalert2';
import soundManager from '../../utils/soundUtils';
import Icon from '../../components/FontAwesome';

export default function CustomerProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('personal');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolderName: '',
    bankRoutingNumber: '',
    bankSwiftCode: '',
    bankAddress: ''
  });

  useEffect(() => {
    if (user) {
      // Populate form with user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      country: user.country || '',
      bankName: user.bankName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankAccountHolderName: user.bankAccountHolderName || '',
      bankRoutingNumber: user.bankRoutingNumber || '',
      bankSwiftCode: user.bankSwiftCode || '',
      bankAddress: user.bankAddress || ''
    });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Show loading state
    Swal.fire({
      title: 'Updating Profile...',
      html: 'Please wait while we update your profile information.',
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
        title: 'Profile Updated!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">Your profile has been successfully updated!</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Welcome back,</p>
            <p style="font-weight: 600; color: #1f2937;">${formData.name}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Go to Dashboard',
        timer: 3000,
        timerProgressBar: true
      });

      // Redirect to customer dashboard
      router.push('/customer');
      
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
        title: 'Photo Updated!',
        text: 'Your profile picture has been updated successfully',
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

  const handleDeleteAccount = async () => {
    try {
      soundManager.playAction();
      const result = await Swal.fire({
        title: 'Delete Account?',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 1rem;">This action cannot be undone!</p>
            <p style="color: #6b7280;">All your data will be permanently deleted.</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete my account',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Call delete account API
        await fetch('/api/auth/delete-account', {
          method: 'DELETE'
        });
        
        await Swal.fire({
          title: 'Account Deleted',
          text: 'Your account has been permanently deleted.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        
        router.push('/');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete account. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="customer-profile-container">
          {/* Header with Profile Picture */}
          <div className="customer-profile-header">
            <div className="customer-profile-header-content">
              <div className="customer-profile-header-text">
                <div className="customer-profile-welcome-badge">
                  <Icon icon={['fas', 'user']} className="customer-profile-badge-icon" />
                  <span className="customer-profile-badge-text">Customer Profile</span>
                </div>
                <h1 className="customer-profile-header-title">
                  Welcome, <span className="customer-profile-customer-name">{user?.name}</span>
                </h1>
                <p className="customer-profile-header-subtitle">
                  Update your personal information and preferences for a better experience
                </p>
              </div>
              <div className="customer-profile-header-actions">
                <div className="customer-profile-avatar-section">
                  <img
                    src={user?.profilePicture || '/images/default-profile.svg'}
                    alt="Profile"
                    className="customer-profile-avatar"
                  />
                  <label className="customer-profile-upload-btn">
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
                        <Icon icon={['fas', 'camera']} />
                        Change Photo
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Progress */}
          <div className="customer-profile-progress-card">
            <div className="customer-profile-progress-header">
              <h3>
                <Icon icon={['fas', 'chart-line']} />
                Profile Completion
              </h3>
              <span className="customer-profile-progress-percentage">75%</span>
            </div>
            <div className="customer-profile-progress-bar">
              <div className="customer-profile-progress-fill" style={{ width: '75%' }}></div>
            </div>
            <p className="customer-profile-progress-hint">
              Complete your profile to unlock all features and build trust with companies
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="customer-profile-tabs">
            <button
              className={`customer-profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <Icon icon={['fas', 'user']} />
              Personal Info
            </button>
            <button
              className={`customer-profile-tab ${activeTab === 'banking' ? 'active' : ''}`}
              onClick={() => setActiveTab('banking')}
            >
              <Icon icon={['fas', 'credit-card']} />
              Banking
            </button>
            <button
              className={`customer-profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Icon icon={['fas', 'cog']} />
              Preferences
            </button>
            <button
              className={`customer-profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Icon icon={['fas', 'shield-alt']} />
              Security
            </button>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <div className={`customer-profile-alert customer-profile-alert-${message.type}`}>
              <Icon icon={['fas', message.type === 'success' ? 'check-circle' : 'exclamation-triangle']} />
              {message.text}
            </div>
          )}

          {/* Form */}
          <div className="customer-profile-form">
            <form onSubmit={handleSubmit}>
              {/* Personal Information Section */}
              {activeTab === 'personal' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'user']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Personal Information</h2>
                </div>
                
                <div className="customer-profile-form-grid">
                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="customer-profile-form-input"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="+966 55 123 4567"
                    />
                  </div>
                </div>

                <div className="customer-profile-form-group">
                  <label className="customer-profile-form-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="customer-profile-form-input customer-profile-disabled-input"
                    placeholder="your.email@example.com"
                  />
                  <small className="customer-profile-form-help">
                    <Icon icon={['fas', 'info-circle']} />
                    Email address cannot be changed for security reasons
                  </small>
                </div>

                <div className="customer-profile-form-group">
                  <label className="customer-profile-form-label">Country</label>
                  <CountrySelect
                    value={formData.country}
                    onChange={(value) => setFormData({ ...formData, country: value })}
                    className="customer-profile-form-input"
                    placeholder="Select your country"
                  />
                </div>

                <div className="customer-profile-form-group customer-profile-form-grid-full">
                  <label className="customer-profile-form-label">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="customer-profile-form-textarea"
                    placeholder="Enter your complete address"
                  />
                </div>
                
                {/* Quick Stats */}
                <div className="customer-profile-stats">
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'clipboard-list']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">12</span>
                      <span className="customer-profile-stat-label">Total Bookings</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'check-circle']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">8</span>
                      <span className="customer-profile-stat-label">Completed</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'star']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">4.8</span>
                      <span className="customer-profile-stat-label">Avg Rating</span>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Banking Information Section */}
              {activeTab === 'banking' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'credit-card']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Banking Information</h2>
                </div>
                
                <div className="customer-profile-form-grid">
                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="Bank Name"
                    />
                  </div>

                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Account Number</label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="Account Number"
                    />
                  </div>

                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Account Holder Name</label>
                    <input
                      type="text"
                      name="bankAccountHolderName"
                      value={formData.bankAccountHolderName}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="Account Holder Name"
                    />
                  </div>

                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Routing Number</label>
                    <input
                      type="text"
                      name="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="Routing Number"
                    />
                  </div>

                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">SWIFT Code</label>
                    <input
                      type="text"
                      name="bankSwiftCode"
                      value={formData.bankSwiftCode}
                      onChange={handleChange}
                      className="customer-profile-form-input"
                      placeholder="SWIFT Code"
                    />
                  </div>

                  <div className="customer-profile-form-group customer-profile-form-grid-full">
                    <label className="customer-profile-form-label">Bank Address</label>
                    <textarea
                      name="bankAddress"
                      value={formData.bankAddress}
                      onChange={handleChange}
                      rows="3"
                      className="customer-profile-form-textarea"
                      placeholder="Bank Address"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Preferences Section */}
              {activeTab === 'preferences' && (
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'bell']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Notification Preferences</h2>
                  </div>
                  
                  <div className="customer-profile-preferences">
                    <div className="customer-profile-preference-item">
                      <div className="customer-profile-preference-info">
                        <h4>Email Notifications</h4>
                        <p>Receive booking confirmations and updates via email</p>
                      </div>
                      <label className="customer-profile-toggle">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
                        <span className="customer-profile-toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="customer-profile-preference-item">
                      <div className="customer-profile-preference-info">
                        <h4>SMS Notifications</h4>
                        <p>Get important updates via text message</p>
                      </div>
                      <label className="customer-profile-toggle">
                        <input
                          type="checkbox"
                          checked={smsNotifications}
                          onChange={(e) => setSmsNotifications(e.target.checked)}
                        />
                        <span className="customer-profile-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'shield-alt']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Security Settings</h2>
                  </div>
                  
                  <div className="customer-profile-security-options">
                    <div className="customer-profile-security-item">
                      <div className="customer-profile-security-info">
                        <h4>
                          <Icon icon={['fas', 'mobile-alt']} />
                          Two-Factor Authentication
                        </h4>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                      <label className="customer-profile-toggle">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        />
                        <span className="customer-profile-toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="customer-profile-security-item">
                      <div className="customer-profile-security-info">
                        <h4>
                          <Icon icon={['fas', 'key']} />
                          Change Password
                        </h4>
                        <p>Update your account password</p>
                      </div>
                      <button type="button" className="customer-profile-btn-secondary">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="customer-profile-danger-zone">
                      <h4>
                        <Icon icon={['fas', 'exclamation-triangle']} />
                        Danger Zone
                      </h4>
                      <p>Once you delete your account, there is no going back.</p>
                      <button 
                        type="button" 
                        className="customer-profile-btn-danger"
                        onClick={handleDeleteAccount}
                      >
                        <Icon icon={['fas', 'trash']} />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'personal' || activeTab === 'banking') && (
                <button
                  type="submit"
                  disabled={loading}
                  className="customer-profile-submit-button"
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
              )}
            </form>
          </div>
          
          {/* Recent Activity */}
          <div className="customer-profile-activity">
            <h3>
              <Icon icon={['fas', 'history']} />
              Recent Activity
            </h3>
            <div className="customer-profile-activity-list">
              <div className="customer-profile-activity-item">
                <div className="customer-profile-activity-icon">
                  <Icon icon={['fas', 'check-circle']} />
                </div>
                <div className="customer-profile-activity-content">
                  <p>Completed booking with Al-Haramain Tours</p>
                  <span>2 days ago</span>
                </div>
              </div>
              <div className="customer-profile-activity-item">
                <div className="customer-profile-activity-icon">
                  <Icon icon={['fas', 'star']} />
                </div>
                <div className="customer-profile-activity-content">
                  <p>Left a 5-star review</p>
                  <span>1 week ago</span>
                </div>
              </div>
              <div className="customer-profile-activity-item">
                <div className="customer-profile-activity-icon">
                  <Icon icon={['fas', 'user-edit']} />
                </div>
                <div className="customer-profile-activity-content">
                  <p>Updated profile information</p>
                  <span>2 weeks ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}