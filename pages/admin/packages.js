import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import packageService from '@/services/packageService';
import Icon from '@/components/FontAwesome';
import soundManager from '@/utils/soundUtils';
import Swal from 'sweetalert2';

export default function AdminPackages() {
  const [allPackages, setAllPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [statusFilter, countryFilter, search, allPackages]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await packageService.getPackages({ limit: 100 });
      setAllPackages(response.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    let filtered = [...allPackages];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }

    // Filter by country
    if (countryFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.country === countryFilter);
    }

    // Filter by search term
    if (search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(pkg => 
        pkg.title.toLowerCase().includes(searchTerm) ||
        pkg.description.toLowerCase().includes(searchTerm) ||
        (pkg.company?.name && pkg.company.name.toLowerCase().includes(searchTerm)) ||
        (pkg.company?.companyName && pkg.company.companyName.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredPackages(filtered);
  };

  const handleToggleStatus = async (packageId, currentStatus) => {
    const pkg = allPackages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    const actionTitle = `${action.charAt(0).toUpperCase() + action.slice(1)} Package?`;
    const actionMessage = newStatus === 'active' 
      ? 'This package will be visible to customers and available for booking.' 
      : 'This package will be hidden from customers and unavailable for booking.';
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: actionTitle,
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">Package:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${pkg.title}</p>
          <p style="color: #6b7280; margin-bottom: 0.5rem;">Company: ${pkg.company?.name || pkg.company?.companyName || 'Unknown'}</p>
          <p style="color: #6b7280; margin-bottom: 1rem;">Price: $${pkg.price}</p>
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #6b7280; margin: 0;">${actionMessage}</p>
          </div>
        </div>
      `,
      icon: newStatus === 'active' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#10b981' : '#ef4444',
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
      focusCancel: true
    });

    if (!result.isConfirmed) return;
    
    try {
      // Play action sound
      // soundManager.playAction();
      
      await packageService.updatePackageStatus(packageId, newStatus);
      
      // Update the package in allPackages array
      setAllPackages(prevPackages => 
        prevPackages.map(pkg => 
          pkg.id === packageId ? { ...pkg, status: newStatus } : pkg
        )
      );
      
      // Show success toast
      Swal.fire({
        title: 'Updated!',
        text: `Package ${action}d successfully!`,
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
      soundManager.playAction();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update package status: ' + (error.message || 'Unknown error'),
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueCountries = () => {
    const countries = [...new Set(allPackages.map(pkg => pkg.country).filter(Boolean))];
    return countries.sort();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'inactive': return 'inactive';
      case 'pending': return 'pending';
      default: return 'inactive';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-packages-container">
          {/* Header */}
          <div className="admin-packages-header">
            <div className="admin-packages-header-content">
              <div className="admin-packages-header-text">
                <div className="admin-packages-breadcrumb">
                  <Icon icon="tachometer-alt" />
                  <span>Admin</span>
                  <Icon icon="chevron-right" />
                  <span>Package Management</span>
                </div>
                <h1 className="admin-packages-title">Package Management</h1>
                <p className="admin-packages-subtitle">
                  Monitor and manage all Umrah packages from companies
                </p>
              </div>
              <div className="admin-packages-stats">
                <div className="admin-packages-stat-item">
                  <span className="admin-packages-stat-number">{filteredPackages.length}</span>
                  <span className="admin-packages-stat-label">
                    {statusFilter === 'all' ? 'Total Packages' : `${statusFilter} Packages`}
                  </span>
                </div>
                <div className="admin-packages-stat-item">
                  <span className="admin-packages-stat-number">
                    {allPackages.filter(pkg => pkg.status === 'active').length}
                  </span>
                  <span className="admin-packages-stat-label">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="admin-packages-filters">
            <div className="admin-packages-filter-item">
              <label className="admin-packages-filter-label">
                <Icon icon="filter" />
                Filter by status
              </label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-packages-select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="admin-packages-filter-item">
              <label className="admin-packages-filter-label">
                <Icon icon="globe" />
                Filter by country
              </label>
              <select 
                value={countryFilter} 
                onChange={(e) => setCountryFilter(e.target.value)}
                className="admin-packages-select"
              >
                <option value="all">All Countries</option>
                {getUniqueCountries().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div className="admin-packages-search">
              <div className="admin-packages-search-input">
                <Icon icon="search" className="admin-packages-search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, description, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="admin-packages-clear-btn"
                  title="Clear search"
                >
                  <Icon icon="times" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Packages Grid */}
          <div className="admin-packages-content">
            {loading ? (
              <div className="admin-packages-loading-state">
                <div className="admin-packages-loading-spinner"></div>
                <span>Loading packages...</span>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="admin-packages-empty-state">
                <div className="admin-packages-empty-icon">
                  <Icon icon="suitcase" />
                </div>
                <h3>No packages found</h3>
                <p>No packages match your current filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="admin-packages-grid">
                {filteredPackages.map((pkg) => (
                  <div key={pkg.id} className="admin-packages-card">
                    <div className="admin-packages-card-header">
                      <div className={`admin-packages-status-badge ${getStatusBadgeClass(pkg.status)}`}>
                        <Icon icon={
                          pkg.status === 'active' ? 'check-circle' : 
                          pkg.status === 'pending' ? 'clock' : 'times-circle'
                        } />
                        {pkg.status}
                      </div>
                      <div className="admin-packages-card-menu">
                        <Icon icon="ellipsis-v" />
                      </div>
                    </div>

                    <div className="admin-packages-card-content">
                      <div className="admin-packages-package-info">
                        <h3 className="admin-packages-package-title">{pkg.title}</h3>
                        <p className="admin-packages-package-description">
                          {pkg.description?.substring(0, 100)}
                          {pkg.description?.length > 100 ? '...' : ''}
                        </p>
                      </div>

                      <div className="admin-packages-package-details">
                        <div className="admin-packages-detail-row">
                          <div className="admin-packages-detail-item">
                            <Icon icon="building" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Company</span>
                            <span className="admin-packages-detail-value">
                              {pkg.company?.name || pkg.company?.companyName || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        <div className="admin-packages-detail-row">
                          <div className="admin-packages-detail-item">
                            <Icon icon="dollar-sign" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Price</span>
                            <span className="admin-packages-detail-value admin-packages-price">
                              {formatPrice(pkg.price)}
                            </span>
                          </div>
                          <div className="admin-packages-detail-item">
                            <Icon icon="clock" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Duration</span>
                            <span className="admin-packages-detail-value">
                              {pkg.duration} days
                            </span>
                          </div>
                        </div>

                        <div className="admin-packages-detail-row">
                          <div className="admin-packages-detail-item">
                            <Icon icon="globe" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Country</span>
                            <span className="admin-packages-detail-value">
                              {pkg.country}
                            </span>
                          </div>
                          <div className="admin-packages-detail-item">
                            <Icon icon="users" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Capacity</span>
                            <span className="admin-packages-detail-value">
                              {pkg.availableSeats}/{pkg.totalSeats}
                            </span>
                          </div>
                        </div>

                        <div className="admin-packages-detail-row">
                          <div className="admin-packages-detail-item">
                            <Icon icon="calendar" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Departure</span>
                            <span className="admin-packages-detail-value">
                              {formatDate(pkg.departureDate)}
                            </span>
                          </div>
                          <div className="admin-packages-detail-item">
                            <Icon icon="calendar-check" className="admin-packages-detail-icon" />
                            <span className="admin-packages-detail-label">Created</span>
                            <span className="admin-packages-detail-value">
                              {formatDate(pkg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-packages-card-footer">
                      <button
                        onClick={() => handleToggleStatus(pkg.id, pkg.status)}
                        className={`admin-packages-action-btn ${pkg.status === 'active' ? 'deactivate' : 'activate'}`}
                      >
                        <Icon icon={pkg.status === 'active' ? 'eye-slash' : 'eye'} />
                        {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="admin-packages-view-btn">
                        <Icon icon="external-link-alt" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}