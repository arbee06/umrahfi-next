import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../utils/AuthContext';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import soundManager from '../../utils/soundUtils';
import Icon from '../../components/FontAwesome';

export default function CompanyProfile() {
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
    companyName: '',
    companyLicense: '',
    companyAddress: '',
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
      companyName: user.companyName || '',
      companyLicense: user.companyLicense || '',
      companyAddress: user.companyAddress || '',
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
                
                <div className="company-profile-form-grid">
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

              {/* Banking Information Section */}
              <div className="company-profile-form-section">
                <div className="company-profile-section-header">
                  <Icon icon={['fas', 'university']} className="company-profile-section-icon" />
                  <h2 className="company-profile-section-title">Banking Information</h2>
                </div>
                
                <div className="company-profile-form-grid">
                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="Bank Name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Account Number</label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="Account Number"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Account Holder Name</label>
                    <input
                      type="text"
                      name="bankAccountHolderName"
                      value={formData.bankAccountHolderName}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="Account Holder Name"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">Routing Number</label>
                    <input
                      type="text"
                      name="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="Routing Number"
                    />
                  </div>

                  <div className="company-profile-form-group">
                    <label className="company-profile-form-label">SWIFT Code</label>
                    <input
                      type="text"
                      name="bankSwiftCode"
                      value={formData.bankSwiftCode}
                      onChange={handleChange}
                      className="company-profile-form-input"
                      placeholder="SWIFT Code"
                    />
                  </div>

                  <div className="company-profile-form-group company-profile-form-grid-full">
                    <label className="company-profile-form-label">Bank Address</label>
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
      </Layout>
    </ProtectedRoute>
  );
}