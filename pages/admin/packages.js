import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

export default function AdminPackages() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  useEffect(() => {
    fetchPackages();
  }, [filterStatus, filterApproval]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/packages', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        let filteredPackages = data.packages || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          filteredPackages = filteredPackages.filter(pkg => pkg.status === filterStatus);
        }
        
        if (filterApproval !== 'all') {
          filteredPackages = filteredPackages.filter(pkg => pkg.adminApprovalStatus === filterApproval);
        }
        
        // Apply search
        if (searchTerm) {
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setPackages(filteredPackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      Swal.fire('Error', 'Failed to fetch packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  const handlePackageApproval = async (packageId, action) => {
    let confirmConfig = {};
    
    if (action === 'approve') {
      confirmConfig = {
        title: 'Approve Package?',
        text: 'This package will be made available to customers.',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Yes, Approve!'
      };
    } else if (action === 'reject') {
      confirmConfig = {
        title: 'Reject Package?',
        text: 'This package will be rejected and not available to customers.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Reject!'
      };
    }

    const result = await Swal.fire({
      ...confirmConfig,
      input: action === 'reject' ? 'textarea' : undefined,
      inputPlaceholder: action === 'reject' ? 'Enter rejection reason...' : undefined,
      inputValidator: action === 'reject' ? (value) => {
        if (!value) return 'Please provide a reason for rejection';
      } : undefined,
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const updateData = {
          adminApprovalStatus: action === 'approve' ? 'approved' : 'rejected',
          approvedBy: user.id,
          approvedAt: new Date().toISOString(),
          adminNotes: '',
        };

        if (action === 'reject') {
          updateData.rejectionReason = result.value;
        }

        const response = await fetch(`/api/admin/packages/${packageId}/approval`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          soundManager.playLogin();
          await Swal.fire({
            title: 'Success!',
            text: `Package ${action}d successfully`,
            icon: 'success',
            confirmButtonColor: '#059669',
            timer: 3000,
            timerProgressBar: true
          });

          fetchPackages();
        } else {
          throw new Error('Failed to update package');
        }
      } catch (error) {
        console.error('Error updating package approval:', error);
        Swal.fire('Error', `Failed to ${action} package`, 'error');
      }
    }
  };

  const getApprovalBadge = (adminApprovalStatus) => {
    const statusConfig = {
      approved: { color: 'success', icon: 'check-circle', text: 'Approved' },
      pending: { color: 'warning', icon: 'clock', text: 'Pending' },
      rejected: { color: 'danger', icon: 'times-circle', text: 'Rejected' }
    };

    const config = statusConfig[adminApprovalStatus] || statusConfig.pending;
    return (
      <span className={`admin-badge admin-badge-${config.color}`}>
        <Icon icon={['fas', config.icon]} className="admin-badge-icon" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPendingPackagesCount = () => {
    return packages.filter(pkg => pkg.adminApprovalStatus === 'pending').length;
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-packages-container">
          <div className="admin-header">
            <div className="admin-header-content">
              <div className="admin-header-text">
                <div className="admin-welcome-badge">
                  <Icon icon={['fas', 'box']} className="admin-badge-icon" />
                  <span className="admin-badge-text">Package Management</span>
                </div>
                <h1 className="admin-header-title">
                  All Packages
                </h1>
                <p className="admin-header-subtitle">
                  Review and approve company packages ({getPendingPackagesCount()} pending approval)
                </p>
              </div>
              <div className="admin-header-actions">
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
                    placeholder="Search packages by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Search
                </button>
              </form>

              <div className="admin-filter-sections">
                <div className="admin-filter-group">
                  <label>Status:</label>
                  <div className="admin-filter-tabs">
                    <button 
                      className={`admin-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('all')}
                    >
                      All
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

                <div className="admin-filter-group">
                  <label>Approval:</label>
                  <div className="admin-filter-tabs">
                    <button 
                      className={`admin-filter-tab ${filterApproval === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterApproval('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`admin-filter-tab ${filterApproval === 'pending' ? 'active' : ''}`}
                      onClick={() => setFilterApproval('pending')}
                    >
                      Pending
                    </button>
                    <button 
                      className={`admin-filter-tab ${filterApproval === 'approved' ? 'active' : ''}`}
                      onClick={() => setFilterApproval('approved')}
                    >
                      Approved
                    </button>
                    <button 
                      className={`admin-filter-tab ${filterApproval === 'rejected' ? 'active' : ''}`}
                      onClick={() => setFilterApproval('rejected')}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <Icon icon={['fas', 'spinner']} spin size="3x" />
                <p>Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="admin-empty-state">
                <Icon icon={['fas', 'box']} size="4x" className="admin-empty-icon" />
                <h3>No packages found</h3>
                <p>No packages match your search criteria.</p>
              </div>
            ) : (
              <div className="admin-packages-grid">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="admin-package-card">
                    <div className="admin-package-header">
                      <h4>{pkg.title}</h4>
                      <div className="admin-package-badges">
                        {getApprovalBadge(pkg.adminApprovalStatus)}
                        <span className={`admin-badge admin-badge-${pkg.status === 'active' ? 'success' : 'danger'}`}>
                          {pkg.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="admin-package-description">{pkg.description}</p>
                    
                    <div className="admin-package-details">
                      <div className="admin-package-detail">
                        <Icon icon={['fas', 'money-bill-wave']} />
                        <span>Price: ${pkg.price}</span>
                      </div>
                      <div className="admin-package-detail">
                        <Icon icon={['fas', 'clock']} />
                        <span>Duration: {pkg.duration} days</span>
                      </div>
                      <div className="admin-package-detail">
                        <Icon icon={['fas', 'users']} />
                        <span>Seats: {pkg.availableSeats}/{pkg.totalSeats}</span>
                      </div>
                      <div className="admin-package-detail">
                        <Icon icon={['fas', 'calendar-alt']} />
                        <span>Departure: {formatDate(pkg.departureDate)}</span>
                      </div>
                    </div>
                    
                    <div className="admin-package-actions">
                      <button 
                        onClick={() => router.push(`/admin/company/${pkg.companyId}`)}
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                      >
                        <Icon icon={['fas', 'building']} />
                        View Company
                      </button>
                      
                      {pkg.adminApprovalStatus === 'pending' && (
                        <>
                          <button 
                            onClick={() => handlePackageApproval(pkg.id, 'approve')}
                            className="admin-btn admin-btn-sm admin-btn-success"
                          >
                            <Icon icon={['fas', 'check']} />
                            Approve
                          </button>
                          <button 
                            onClick={() => handlePackageApproval(pkg.id, 'reject')}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                          >
                            <Icon icon={['fas', 'times']} />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {pkg.adminApprovalStatus === 'approved' && (
                        <button 
                          onClick={() => handlePackageApproval(pkg.id, 'reject')}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                        >
                          <Icon icon={['fas', 'ban']} />
                          Revoke
                        </button>
                      )}
                      
                      {pkg.adminApprovalStatus === 'rejected' && (
                        <button 
                          onClick={() => handlePackageApproval(pkg.id, 'approve')}
                          className="admin-btn admin-btn-sm admin-btn-success"
                        >
                          <Icon icon={['fas', 'check']} />
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .admin-packages-container {
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

          .admin-filter-sections {
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
          }

          .admin-filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .admin-filter-group label {
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
          }

          .admin-filter-tabs {
            display: flex;
            gap: 0.5rem;
          }

          .admin-filter-tab {
            padding: 0.5rem 1rem;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.875rem;
          }

          .admin-filter-tab:hover {
            background: #f9fafb;
          }

          .admin-filter-tab.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }

          .admin-packages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
          }

          .admin-package-card {
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            padding: 1.5rem;
            background: white;
            transition: all 0.3s;
          }

          .admin-package-card:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .admin-package-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .admin-package-header h4 {
            margin: 0;
            color: #1e293b;
            flex: 1;
          }

          .admin-package-badges {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .admin-package-description {
            color: #6b7280;
            margin-bottom: 1rem;
            line-height: 1.5;
          }

          .admin-package-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .admin-package-detail {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .admin-package-detail svg {
            color: #3b82f6;
            width: 14px;
          }

          .admin-package-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .admin-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .admin-badge-success {
            background: #d1fae5;
            color: #065f46;
          }

          .admin-badge-warning {
            background: #fef3c7;
            color: #92400e;
          }

          .admin-badge-danger {
            background: #fee2e2;
            color: #991b1b;
          }

          .admin-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
          }

          .admin-btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
          }

          .admin-btn-primary {
            background: #3b82f6;
            color: white;
          }

          .admin-btn-primary:hover {
            background: #2563eb;
          }

          .admin-btn-secondary {
            background: #6b7280;
            color: white;
          }

          .admin-btn-secondary:hover {
            background: #4b5563;
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
            .admin-packages-container {
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

            .admin-filter-sections {
              flex-direction: column;
              gap: 1rem;
            }

            .admin-packages-grid {
              grid-template-columns: 1fr;
            }

            .admin-package-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  );
}