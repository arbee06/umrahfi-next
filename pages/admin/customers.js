import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

export default function AdminCustomers() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [filterStatus]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        role: 'customer',
        search: searchTerm
      };
      
      if (filterStatus !== 'all') {
        params.isActive = filterStatus === 'active' ? 'true' : 'false';
      }
      const data = await adminService.getUsers(params);
      setCustomers(data.users || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Swal.fire('Error', 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleViewCustomer = (customerId) => {
    router.push(`/admin/customer/${customerId}`);
  };

  const handleToggleActive = async (customerId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Customer?`,
      text: currentStatus 
        ? 'This will prevent the customer from accessing the platform and booking packages.'
        : 'This will allow the customer to access the platform and book packages.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#dc2626' : '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}!`
    });

    if (result.isConfirmed) {
      try {
        await adminService.updateUser(customerId, { isActive: !currentStatus });
        soundManager.playAction();
        Swal.fire({
          title: 'Success!',
          text: `Customer ${action}d successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCustomers();
      } catch (error) {
        Swal.fire('Error', `Failed to ${action} customer`, 'error');
      }
    }
  };

  const getJoinedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBookingCount = (customer) => {
    return customer.bookingCount || 0;
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      country: customer.country || '',
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    if (!editingCustomer && (!formData.password || formData.password !== formData.confirmPassword)) {
      Swal.fire('Error', 'Password is required and must match confirmation', 'error');
      return;
    }

    if (editingCustomer && formData.password && formData.password !== formData.confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    try {
      const submitData = {
        ...formData,
        role: 'customer'
      };
      
      // Remove password fields if not provided for edit
      if (editingCustomer && !formData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }

      if (editingCustomer) {
        await adminService.updateUser(editingCustomer.id, submitData);
        soundManager.playAction();
        Swal.fire({
          title: 'Success!',
          text: 'Customer updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await adminService.createUser(submitData);
        soundManager.playLogin();
        Swal.fire({
          title: 'Success!',
          text: 'Customer created successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      Swal.fire('Error', error.message || 'Failed to save customer', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-customers-container">
          <div className="admin-header">
            <div className="admin-header-content">
              <div className="admin-header-text">
                <div className="admin-welcome-badge">
                  <Icon icon={['fas', 'users']} className="admin-badge-icon" />
                  <span className="admin-badge-text">Customer Management</span>
                </div>
                <h1 className="admin-header-title">
                  Customer Directory
                </h1>
                <p className="admin-header-subtitle">
                  Manage and monitor customer accounts
                </p>
              </div>
              <div className="admin-header-actions">
                <button onClick={handleCreateCustomer} className="admin-btn admin-btn-primary admin-btn-create">
                  <Icon icon={['fas', 'plus']} />
                  Create Customer
                </button>
                <div className="admin-avatar-circle">
                  <Icon icon={['fas', 'user-shield']} />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-content">
            <div className="admin-filters">
              <form onSubmit={handleSearch} className="admin-search-form">
                <div className="admin-search-input-wrapper">
                  <Icon icon={['fas', 'search']} className="admin-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Search
                </button>
              </form>

              <div className="admin-filter-tabs">
                <button 
                  className={`admin-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All Customers
                </button>
                <button 
                  className={`admin-filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </button>
                <button 
                  className={`admin-filter-tab ${filterStatus === 'inactive' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <Icon icon={['fas', 'spinner']} spin size="3x" />
                <p>Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="admin-empty-state">
                <Icon icon={['fas', 'users']} size="4x" className="admin-empty-icon" />
                <h3>No customers found</h3>
                <p>No customers match your search criteria.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Bookings</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="admin-table-row-clickable" onClick={() => handleViewCustomer(customer.id)}>
                        <td>
                          <div className="admin-user-info">
                            <div className="admin-user-avatar">
                              {customer.profilePicture ? (
                                <img src={customer.profilePicture} alt={customer.name} />
                              ) : (
                                <Icon icon={['fas', 'user']} />
                              )}
                            </div>
                            <div>
                              <div className="admin-user-name">{customer.name}</div>
                              <div className="admin-user-email">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-contact-info">
                            <div>{customer.email}</div>
                            {customer.phone && <div className="admin-text-muted">{customer.phone}</div>}
                          </div>
                        </td>
                        <td>
                          <div className="admin-location-info">
                            {customer.country && (
                              <div className="admin-country">
                                <Icon icon={['fas', 'globe']} className="admin-location-icon" />
                                {customer.country}
                              </div>
                            )}
                            {customer.address && (
                              <div className="admin-address">{customer.address}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-booking-count">
                            <Icon icon={['fas', 'calendar-check']} className="admin-booking-icon" />
                            <span>{getBookingCount(customer)}</span>
                          </div>
                        </td>
                        <td>{getJoinedDate(customer.createdAt)}</td>
                        <td>
                          <span className={`admin-badge ${customer.isActive ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                            <Icon icon={['fas', customer.isActive ? 'check' : 'times']} className="admin-badge-icon" />
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="admin-actions">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                            >
                              <Icon icon={['fas', 'edit']} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(customer.id, customer.isActive)}
                              className={`admin-btn admin-btn-sm ${customer.isActive ? 'admin-btn-danger' : 'admin-btn-success'}`}
                            >
                              <Icon icon={['fas', customer.isActive ? 'ban' : 'check']} />
                              {customer.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={handleCloseModal}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{editingCustomer ? 'Edit Customer' : 'Create Customer'}</h3>
                <button onClick={handleCloseModal} className="admin-modal-close">
                  <Icon icon={['fas', 'times']} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="admin-modal-form">
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group admin-form-group-full">
                    <label>Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="admin-form-textarea"
                      rows="3"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>{editingCustomer ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingCustomer}
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required={!editingCustomer || formData.password}
                      className="admin-form-input"
                    />
                  </div>
                </div>
                
                <div className="admin-modal-actions">
                  <button type="button" onClick={handleCloseModal} className="admin-btn admin-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          .admin-customers-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          .admin-header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
            border-radius: 2rem;
            padding: 3rem;
            color: white;
            margin-bottom: 2rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .admin-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .admin-welcome-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 0.75rem 1.5rem;
            border-radius: 2rem;
            margin-bottom: 1rem;
          }

          .admin-badge-icon {
            font-size: 1.25rem;
          }

          .admin-badge-text {
            font-weight: 600;
            font-size: 1.1rem;
          }

          .admin-header-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
          }

          .admin-header-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-top: 0.5rem;
          }

          .admin-avatar-circle {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }

          .admin-content {
            background: white;
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }

          .admin-filters {
            margin-bottom: 2rem;
          }

          .admin-search-form {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .admin-search-input-wrapper {
            flex: 1;
            position: relative;
          }

          .admin-search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
          }

          .admin-search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 3rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.75rem;
            font-size: 1rem;
            transition: all 0.3s;
          }

          .admin-search-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .admin-filter-tabs {
            display: flex;
            gap: 1rem;
          }

          .admin-filter-tab {
            padding: 0.75rem 1.5rem;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
          }

          .admin-filter-tab:hover {
            background: #f9fafb;
          }

          .admin-filter-tab.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }

          .admin-table-wrapper {
            overflow-x: auto;
          }

          .admin-table {
            width: 100%;
            border-collapse: collapse;
          }

          .admin-table th {
            text-align: left;
            padding: 1rem;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }

          .admin-table td {
            padding: 1rem;
            border-bottom: 1px solid #f3f4f6;
          }

          .admin-table-row-clickable {
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .admin-table-row-clickable:hover {
            background-color: #f9fafb;
          }

          .admin-user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .admin-user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .admin-user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .admin-user-name {
            font-weight: 600;
            color: #111827;
          }

          .admin-user-email {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .admin-contact-info {
            font-size: 0.875rem;
          }

          .admin-location-info {
            font-size: 0.875rem;
          }

          .admin-country {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
          }

          .admin-location-icon {
            color: #6b7280;
          }

          .admin-address {
            color: #6b7280;
            font-size: 0.8rem;
          }

          .admin-booking-count {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
          }

          .admin-booking-icon {
            color: #3b82f6;
          }

          .admin-text-muted {
            color: #6b7280;
          }

          .admin-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .admin-badge-success {
            background: #d1fae5;
            color: #065f46;
          }

          .admin-badge-danger {
            background: #fee2e2;
            color: #991b1b;
          }

          .admin-actions {
            display: flex;
            gap: 0.5rem;
          }

          .admin-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .admin-btn-sm {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }

          .admin-btn-primary {
            background: #3b82f6;
            color: white;
          }

          .admin-btn-primary:hover {
            background: #2563eb;
          }

          .admin-btn-success {
            background: #10b981;
            color: white;
          }

          .admin-btn-success:hover {
            background: #059669;
          }

          .admin-btn-danger {
            background: #ef4444;
            color: white;
          }

          .admin-btn-danger:hover {
            background: #dc2626;
          }

          .admin-btn-secondary {
            background: #6b7280;
            color: white;
          }

          .admin-btn-secondary:hover {
            background: #4b5563;
          }

          .admin-btn-create {
            margin-right: 1rem;
          }

          .admin-loading {
            text-align: center;
            padding: 4rem;
            color: #6b7280;
          }

          .admin-empty-state {
            text-align: center;
            padding: 4rem;
            color: #6b7280;
          }

          .admin-empty-icon {
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          @media (max-width: 768px) {
            .admin-customers-container {
              padding: 1rem;
            }

            .admin-header {
              padding: 2rem;
            }

            .admin-header-content {
              flex-direction: column;
              text-align: center;
              gap: 2rem;
            }

            .admin-filter-tabs {
              flex-wrap: wrap;
            }

            .admin-table {
              font-size: 0.875rem;
            }

            .admin-actions {
              flex-direction: column;
            }
          }

          /* Modal Styles */
          .admin-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 2rem;
          }

          .admin-modal {
            background: white;
            border-radius: 1rem;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }

          .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .admin-modal-header h3 {
            margin: 0;
            font-size: 1.5rem;
            color: #1f2937;
          }

          .admin-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
          }

          .admin-modal-close:hover {
            background: #f3f4f6;
            color: #374151;
          }

          .admin-modal-form {
            padding: 2rem;
          }

          .admin-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .admin-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .admin-form-group-full {
            grid-column: 1 / -1;
          }

          .admin-form-group label {
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }

          .admin-form-input {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .admin-form-input:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .admin-form-textarea {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.2s;
          }

          .admin-form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .admin-modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          @media (max-width: 768px) {
            .admin-modal-overlay {
              padding: 1rem;
            }

            .admin-modal {
              max-height: 95vh;
            }

            .admin-modal-header {
              padding: 1.5rem 1.5rem 1rem 1.5rem;
            }

            .admin-modal-form {
              padding: 1.5rem;
            }

            .admin-form-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .admin-modal-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  );
}