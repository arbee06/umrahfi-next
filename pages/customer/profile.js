// File: umrahfi-next/pages/customer/profile.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../utils/AuthContext';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import soundManager from '../../utils/soundUtils';
import Icon from '../../components/FontAwesome';

export default function CustomerProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
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
              </div>

              {/* Banking Information Section */}
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
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}