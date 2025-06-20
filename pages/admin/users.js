import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import adminService from '@/services/adminService';
import Icon from '@/components/FontAwesome';
import Swal from 'sweetalert2';

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filter, search, allUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100 // Get more users since we're filtering client-side
      };

      const response = await adminService.getUsers(params);
      setAllUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];

    // Filter by role
    if (filter !== 'all') {
      filtered = filtered.filter(user => user.role === filter);
    }

    // Filter by search term
    if (search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.companyName && user.companyName.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = () => {
    // Search is now handled automatically by useEffect
    // This function can be removed or kept for explicit search button
    filterUsers();
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const action = currentStatus ? 'deactivate' : 'activate';
    const actionTitle = currentStatus ? 'Deactivate User?' : 'Activate User?';
    
    // Create detailed warning message based on user role
    let actionMessage = '';
    let cascadingEffects = '';
    
    if (currentStatus) {
      // Deactivating user
      actionMessage = 'This user will be unable to access the system.';
      
      if (user.role === 'customer') {
        cascadingEffects = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
            <p style="color: #dc2626; margin: 0; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Cascading Effects:</p>
            <ul style="color: #dc2626; margin: 0; padding-left: 1.5rem;">
              <li>All ongoing orders will be <strong>cancelled</strong></li>
              <li>Customer will lose access to active bookings</li>
            </ul>
          </div>
        `;
      } else if (user.role === 'company') {
        cascadingEffects = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
            <p style="color: #dc2626; margin: 0; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Cascading Effects:</p>
            <ul style="color: #dc2626; margin: 0; padding-left: 1.5rem;">
              <li>All company packages will be <strong>deactivated</strong></li>
              <li>All ongoing orders for their packages will be <strong>cancelled</strong></li>
              <li>Company will lose access to package management</li>
              <li>Customers with active bookings will be affected</li>
            </ul>
          </div>
        `;
      }
    } else {
      // Activating user
      actionMessage = 'This user will regain access to the system.';
      if (user.role === 'company') {
        cascadingEffects = `
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
            <p style="color: #1d4ed8; margin: 0; font-weight: 600; margin-bottom: 0.5rem;">ℹ️ Note:</p>
            <p style="color: #1d4ed8; margin: 0;">Company packages will remain deactivated and need to be manually reactivated if needed.</p>
          </div>
        `;
      }
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: actionTitle,
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">User:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${user.name}</p>
          <p style="color: #6b7280; margin-bottom: 0.5rem;">${user.email}</p>
          <p style="color: #6b7280; margin-bottom: 1rem;">Role: ${user.role}</p>
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">
            <p style="color: #6b7280; margin: 0;">${actionMessage}</p>
          </div>
          ${cascadingEffects}
        </div>
      `,
      icon: currentStatus ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html',
        confirmButton: 'custom-swal-confirm',
        cancelButton: 'custom-swal-cancel'
      },
      buttonsStyling: false,
      focusConfirm: false,
      focusCancel: true,
      width: '500px'
    });

    if (!result.isConfirmed) return;
    
    try {
      await adminService.updateUser(userId, { isActive: !currentStatus });
      // Update the user in allUsers array
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );
      
      // Show success toast
      Swal.fire({
        title: 'Updated!',
        text: `User ${action}d successfully!`,
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        customClass: {
          popup: 'custom-swal-toast'
        }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update user status: ' + (error.error || 'Unknown error'),
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-users-container">
          {/* Header */}
          <div className="admin-users-header">
            <div className="admin-users-header-content">
              <div className="admin-users-header-text">
                <div className="admin-users-breadcrumb">
                  <Icon icon="tachometer-alt" />
                  <span>Admin</span>
                  <Icon icon="chevron-right" />
                  <span>User Management</span>
                </div>
                <h1 className="admin-users-title">User Management</h1>
                <p className="admin-users-subtitle">
                  Manage all platform users, their roles, and account status
                </p>
              </div>
              <div className="admin-users-stats">
                <div className="admin-users-stat-item">
                  <span className="admin-users-stat-number">{filteredUsers.length}</span>
                  <span className="admin-users-stat-label">{filter === 'all' ? 'Total Users' : `${filter} Users`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="admin-users-filters">
            <div className="admin-users-filter-item">
              <label className="admin-users-filter-label">
                <Icon icon="filter" />
                Filter by role
              </label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="admin-users-select"
              >
                <option value="all">All Users</option>
                <option value="customer">Customers</option>
                <option value="company">Companies</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            <div className="admin-users-search">
              <div className="admin-users-search-input">
                <Icon icon="search" className="admin-users-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="admin-users-clear-btn"
                  title="Clear search"
                >
                  <Icon icon="times" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-users-table-container">
            {loading ? (
              <div className="admin-users-loading-state">
                <div className="admin-users-loading-spinner"></div>
                <span>Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-users-empty-state">
                <div className="admin-users-empty-icon">
                  <Icon icon="users" />
                </div>
                <h3>No users found</h3>
                <p>No users match your current filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="admin-users-table-wrapper">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="user" />
                          User Details
                        </div>
                      </th>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="envelope" />
                          Contact
                        </div>
                      </th>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="building" />
                          Company
                        </div>
                      </th>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="calendar" />
                          Join Date
                        </div>
                      </th>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="toggle-on" />
                          Status
                        </div>
                      </th>
                      <th>
                        <div className="admin-users-th-content">
                          <Icon icon="cog" />
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="admin-users-table-row">
                        <td>
                          <div className="admin-users-user-info">
                            <div className="admin-users-user-avatar">
                              <Icon icon="user" />
                            </div>
                            <div className="admin-users-user-details">
                              <div className="admin-users-user-name">{user.name}</div>
                              <div className={`admin-users-role-badge ${user.role}`}>
                                <Icon icon={
                                  user.role === 'admin' ? 'shield-alt' : 
                                  user.role === 'company' ? 'building' : 'user'
                                } />
                                {user.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-users-contact-info">
                            <div className="admin-users-email">{user.email}</div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-users-company">
                            {user.companyName || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="admin-users-date">
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className={`admin-users-status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            <Icon icon={user.isActive ? 'check-circle' : 'times-circle'} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            className={`admin-users-action-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                          >
                            <Icon icon={user.isActive ? 'user-slash' : 'user-check'} />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}