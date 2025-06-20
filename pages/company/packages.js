// File: pages/company/packages.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import packageService from '@/services/packageService';
import Swal from 'sweetalert2';
import Icon from '@/components/FontAwesome';

export default function CompanyPackages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPackages();
  }, [user]);

  const fetchPackages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await packageService.getPackages({ 
        company: user.id,
        limit: 100 
      });
      setPackages(response.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId, packageTitle) => {
    const result = await Swal.fire({
      title: 'Delete Package?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">You're about to delete:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">${packageTitle}</p>
          <p style="color: #ef4444; font-size: 0.9rem;">This action cannot be undone. All bookings and data associated with this package will be permanently deleted.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Package',
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

    if (result.isConfirmed) {
      // Show loading state
      Swal.fire({
        title: 'Deleting Package...',
        html: 'Please wait while we delete the package.',
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
        await packageService.deletePackage(packageId);
        
        // Success message
        await Swal.fire({
          title: 'Deleted!',
          text: 'Package has been successfully deleted.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'custom-swal-popup',
            confirmButton: 'custom-swal-success'
          },
          buttonsStyling: false
        });
        
        fetchPackages();
      } catch (error) {
        // Error message
        await Swal.fire({
          title: 'Error!',
          text: `Failed to delete package: ${error.error || 'Unknown error'}`,
          icon: 'error',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'custom-swal-popup',
            confirmButton: 'custom-swal-error'
          },
          buttonsStyling: false
        });
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      soldout: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'INACTIVE'}
      </span>
    );
  };

  const filteredPackages = filter === 'all' 
    ? packages 
    : packages.filter(pkg => pkg.status === filter);

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="packages-container">
          {/* Header */}
          <div className="packages-header">
            <div className="packages-header-content">
              <div>
                <h1 className="packages-title">My Packages</h1>
                <p className="packages-subtitle">Manage your travel packages and bookings</p>
              </div>
              <Link href="/company/packages/create">
                <button className="packages-create-btn">
                  <Icon icon="plus" /> Create New Package
                </button>
              </Link>
            </div>
          </div>

          {/* Filter */}
          <div className="packages-filter">
            <div className="packages-filter-content">
              <label className="packages-filter-label">Filter by status:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="packages-filter-select"
              >
                <option value="all">All Packages</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="soldout">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="packages-table-container">
            {loading ? (
              <div className="packages-loading">
                <div className="packages-loading-spinner"></div>
                <span>Loading packages...</span>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="packages-empty">
                <div className="packages-empty-icon">
                  <Icon icon="suitcase" style={{fontSize: '2rem'}} />
                </div>
                <h3>No packages found</h3>
                <p>Create your first package to get started!</p>
                <Link href="/company/packages/create">
                  <button className="packages-empty-btn">
                    <Icon icon="plus" /> Create Package
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="packages-table">
                  <thead>
                    <tr>
                      <th className="text-left">Package Details</th>
                      <th className="text-center">Price</th>
                      <th className="text-center">Departure</th>
                      <th className="text-center">Availability</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.map((pkg) => (
                      <tr key={pkg.id}>
                        {/* Package Details */}
                        <td>
                          <div className="package-details">
                            <h4>{pkg.title}</h4>
                            <span className="package-id">
                              ID: {pkg.id ? pkg.id.toString().slice(-8) : 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="text-center">
                          <span className="price">
                            ${pkg.price || 0}
                          </span>
                        </td>

                        {/* Departure */}
                        <td className="text-center">
                          <span className="date">
                            {pkg.departureDate ? formatDate(pkg.departureDate) : 'N/A'}
                          </span>
                        </td>

                        {/* Availability */}
                        <td className="text-center">
                          <div className="availability">
                            <span className="seats-count">
                              {pkg.availableSeats || 0}/{pkg.totalSeats || 0}
                            </span>
                            <div className="seats-bar">
                              <div 
                                className="seats-progress"
                                style={{ 
                                  width: `${pkg.totalSeats ? ((pkg.totalSeats - (pkg.availableSeats || 0)) / pkg.totalSeats) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="text-center">
                          <span className={`status-badge status-${pkg.status || 'inactive'}`}>
                            {(pkg.status || 'inactive').toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-center">
                          <div className="actions">
                            <button 
                              className="action-btn edit-btn"
                              title="Edit Package"
                              onClick={() => console.log('Edit:', pkg.id)}
                            >
                              <Icon icon="edit" /> Edit
                            </button>
                            <button 
                              onClick={() => pkg.id && handleDelete(pkg.id, pkg.title)}
                              className="action-btn delete-btn"
                              title="Delete Package"
                              disabled={!pkg.id}
                            >
                              <Icon icon="trash" /> Delete
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
      </Layout>
    </ProtectedRoute>
  );
}