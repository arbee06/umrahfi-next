import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

export default function CustomerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
      fetchCustomerBookings();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUser(id);
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      Swal.fire('Error', 'Failed to fetch customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async () => {
    try {
      const response = await fetch(`/api/admin/customer-bookings?customerId=${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleToggleActive = async () => {
    const action = customer.isActive ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Customer?`,
      text: customer.isActive 
        ? 'This will prevent the customer from accessing the platform.'
        : 'This will allow the customer to access the platform.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: customer.isActive ? '#dc2626' : '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}!`
    });

    if (result.isConfirmed) {
      try {
        await adminService.updateUser(id, { isActive: !customer.isActive });
        soundManager.playAction();
        Swal.fire({
          title: 'Success!',
          text: `Customer ${action}d successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCustomerDetails();
      } catch (error) {
        Swal.fire('Error', `Failed to ${action} customer`, 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: 'clock', text: 'Pending' },
      confirmed: { color: 'success', icon: 'check-circle', text: 'Confirmed' },
      cancelled: { color: 'danger', icon: 'times-circle', text: 'Cancelled' },
      completed: { color: 'secondary', icon: 'flag-checkered', text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`admin-badge admin-badge-${config.color}`}>
        <Icon icon={['fas', config.icon]} className="admin-badge-icon" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem'}}>
            <Icon icon={['fas', 'spinner']} spin size="3x" color="#6366f1" />
            <p style={{color: '#6b7280', fontSize: '1.1rem'}}>Loading customer details...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <div className="admin-error-container">
            <Icon icon={['fas', 'exclamation-triangle']} size="3x" />
            <h3>Customer Not Found</h3>
            <p>The customer you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => router.push('/admin/customers')} className="admin-btn admin-btn-primary">
              Back to Customers
            </button>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="customer-profile-container">
          {/* Header */}
          <div className="customer-profile-header">
            <div className="customer-profile-header-content">
              <div className="customer-profile-header-text">
                <button 
                  onClick={() => router.push('/admin/customers')} 
                  className="customer-profile-upload-btn"
                  style={{marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.15)'}}
                >
                  <Icon icon={['fas', 'arrow-left']} />
                  Back to Customers
                </button>
                
                <h1 className="customer-profile-header-title" style={{color: 'white'}}>
                  {customer.name}
                </h1>
                <p className="customer-profile-header-subtitle">
                  {customer.email} • {customer.isActive ? 'Active' : 'Inactive'} Account
                </p>
                
                <div style={{marginTop: '1rem'}}>
                  <button 
                    onClick={handleToggleActive}
                    className="customer-profile-upload-btn"
                    style={{background: customer.isActive ? '#ef4444' : '#10b981'}}
                  >
                    <Icon icon={['fas', customer.isActive ? 'times-circle' : 'check-circle']} />
                    {customer.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div className="customer-profile-header-actions">
                <div className="customer-profile-avatar-section">
                  <img
                    src={customer.profilePicture || '/images/default-profile.svg'}
                    alt={customer.name}
                    className="customer-profile-avatar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="customer-profile-tabs">
            <button 
              className={`customer-profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Icon icon={['fas', 'info-circle']} />
              Overview
            </button>
            <button 
              className={`customer-profile-tab ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Icon icon={['fas', 'calendar-check']} />
              Bookings ({bookings.length})
            </button>
          </div>

          {/* Content */}
          <div className="customer-profile-form">
            {activeTab === 'overview' && (
              <>
                {/* Personal Information Section */}
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'user']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Personal Information</h2>
                  </div>
                  
                  <div className="customer-profile-form-grid">
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Full Name</label>
                      <input type="text" value={customer.name} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Email</label>
                      <input type="email" value={customer.email} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Phone</label>
                      <input type="text" value={customer.phone || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Country</label>
                      <input type="text" value={customer.country || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group customer-profile-form-grid-full">
                      <label className="customer-profile-form-label">Address</label>
                      <textarea value={customer.address || 'Not provided'} disabled className="customer-profile-form-textarea customer-profile-disabled-input" rows="3" />
                    </div>
                  </div>
                </div>

                {/* Account Details Section */}
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'info-circle']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Account Details</h2>
                  </div>
                  
                  <div className="customer-profile-form-grid">
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Member Since</label>
                      <input type="text" value={formatDate(customer.createdAt)} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Account Status</label>
                      <input type="text" value={customer.isActive ? 'Active' : 'Inactive'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Role</label>
                      <input type="text" value="Customer" disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Last Updated</label>
                      <input type="text" value={formatDate(customer.updatedAt)} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="customer-profile-stats">
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'calendar-check']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{bookings.length}</span>
                      <span className="customer-profile-stat-label">Total Bookings</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'check-circle']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{bookings.filter(b => b.status === 'confirmed').length}</span>
                      <span className="customer-profile-stat-label">Confirmed</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'times-circle']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{bookings.filter(b => b.status === 'cancelled').length}</span>
                      <span className="customer-profile-stat-label">Cancelled</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'bookings' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'calendar-check']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Customer Bookings</h2>
                </div>
                
                {bookings.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                    <Icon icon={['fas', 'calendar-check']} size="3x" style={{opacity: 0.5, marginBottom: '1rem'}} />
                    <h3>No bookings found</h3>
                    <p>This customer hasn't made any bookings yet.</p>
                  </div>
                ) : (
                  <div className="customer-profile-activity-list">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="customer-profile-activity-item">
                        <div className="customer-profile-activity-icon">
                          <Icon icon={['fas', booking.status === 'confirmed' ? 'check-circle' : booking.status === 'cancelled' ? 'times-circle' : 'clock']} />
                        </div>
                        <div className="customer-profile-activity-content" style={{flex: 1}}>
                          <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>{booking.packageTitle}</p>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280'}}>
                            <span>📅 {formatDate(booking.createdAt)}</span>
                            <span>👥 {booking.participants || 'N/A'} participants</span>
                            <span>💰 ${booking.totalAmount}</span>
                            <span>💳 {booking.paymentMethod || 'N/A'}</span>
                          </div>
                          <span style={{fontSize: '0.75rem', color: booking.status === 'confirmed' ? '#059669' : booking.status === 'cancelled' ? '#dc2626' : '#d97706', fontWeight: 500, textTransform: 'capitalize'}}>
                            {booking.status}
                          </span>
                        </div>
                        <button className="customer-profile-btn-secondary">
                          <Icon icon={['fas', 'eye']} />
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </Layout>
    </ProtectedRoute>
  );
}