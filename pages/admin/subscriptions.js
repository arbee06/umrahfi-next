import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';
import { getAllPlans, getSubscriptionPlan, formatLimit } from '@/config/subscriptionPlans';

export default function AdminSubscriptions() {
  const router = useRouter();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [subscriptionPlans] = useState(getAllPlans());

  useEffect(() => {
    fetchCompanies();
  }, [filterStatus, filterPlan]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscriptions', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        let filteredCompanies = data.companies || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          filteredCompanies = filteredCompanies.filter(company => 
            company.subscriptionStatus === filterStatus
          );
        }
        
        if (filterPlan !== 'all') {
          filteredCompanies = filteredCompanies.filter(company => 
            company.subscriptionPlan === filterPlan
          );
        }
        
        // Apply search
        if (searchTerm) {
          filteredCompanies = filteredCompanies.filter(company => 
            company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setCompanies(filteredCompanies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Swal.fire('Error', 'Failed to fetch companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleSubscriptionUpdate = async (companyId, action, planId = null) => {
    let confirmConfig = {};
    
    if (action === 'upgrade') {
      const plan = getSubscriptionPlan(planId);
      confirmConfig = {
        title: `Upgrade to ${plan.name}?`,
        text: `This will upgrade the company to ${plan.name} plan.`,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Yes, Upgrade!'
      };
    } else if (action === 'downgrade') {
      const plan = getSubscriptionPlan(planId);
      confirmConfig = {
        title: `Downgrade to ${plan.name}?`,
        text: `This will downgrade the company to ${plan.name} plan.`,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Yes, Downgrade!'
      };
    } else if (action === 'cancel') {
      confirmConfig = {
        title: 'Cancel Subscription?',
        text: 'This will cancel the company subscription.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Cancel!'
      };
    } else if (action === 'activate') {
      confirmConfig = {
        title: 'Activate Subscription?',
        text: 'This will activate the company subscription.',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Yes, Activate!'
      };
    }

    const result = await Swal.fire({
      ...confirmConfig,
      input: action === 'cancel' ? 'textarea' : undefined,
      inputPlaceholder: action === 'cancel' ? 'Enter cancellation reason...' : undefined,
      inputValidator: action === 'cancel' ? (value) => {
        if (!value) return 'Please provide a reason for cancellation';
      } : undefined,
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const updateData = {
          action,
          planId: planId || null,
          adminId: user.id,
          reason: result.value || null
        };

        const response = await fetch(`/api/admin/subscriptions/${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          soundManager.playLogin();
          await Swal.fire({
            title: 'Success!',
            text: `Subscription ${action}d successfully`,
            icon: 'success',
            confirmButtonColor: '#059669',
            timer: 3000,
            timerProgressBar: true
          });

          fetchCompanies();
        } else {
          throw new Error('Failed to update subscription');
        }
      } catch (error) {
        console.error('Error updating subscription:', error);
        Swal.fire('Error', `Failed to ${action} subscription`, 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'success', icon: 'check-circle', text: 'Active' },
      trial: { color: 'warning', icon: 'clock', text: 'Trial' },
      cancelled: { color: 'danger', icon: 'times-circle', text: 'Cancelled' },
      expired: { color: 'danger', icon: 'exclamation-triangle', text: 'Expired' },
      inactive: { color: 'secondary', icon: 'pause-circle', text: 'Inactive' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`admin-badge admin-badge-${config.color}`}>
        <Icon icon={['fas', config.icon]} className="admin-badge-icon" />
        {config.text}
      </span>
    );
  };

  const getPlanBadge = (planId) => {
    const plan = getSubscriptionPlan(planId);
    const planClass = plan ? `admin-plan-${plan.id}` : 'admin-plan-no-plan';
    const planName = plan ? plan.name : 'No Plan';
    
    return (
      <span className={`admin-plan-badge ${planClass}`}>
        {planName}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActiveSubscriptionsCount = () => {
    return companies.filter(company => company.subscriptionStatus === 'active').length;
  };

  const getTrialSubscriptionsCount = () => {
    return companies.filter(company => company.subscriptionStatus === 'trial').length;
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-subscriptions-container">
          <div className="admin-header">
            <div className="admin-header-content">
              <div className="admin-header-text">
                <div className="admin-welcome-badge">
                  <Icon icon={['fas', 'credit-card']} className="admin-badge-icon" />
                  <span className="admin-badge-text">Subscription Management</span>
                </div>
                <h1 className="admin-header-title">
                  Company Subscriptions
                </h1>
                <p className="admin-header-subtitle">
                  Manage company subscriptions and billing ({getActiveSubscriptionsCount()} active, {getTrialSubscriptionsCount()} trial)
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
                    placeholder="Search companies by name or email..."
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
                      className={`admin-filter-tab ${filterStatus === 'trial' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('trial')}
                    >
                      Trial
                    </button>
                    <button 
                      className={`admin-filter-tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('cancelled')}
                    >
                      Cancelled
                    </button>
                    <button 
                      className={`admin-filter-tab ${filterStatus === 'expired' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('expired')}
                    >
                      Expired
                    </button>
                  </div>
                </div>

                <div className="admin-filter-group">
                  <label>Plan:</label>
                  <div className="admin-filter-tabs">
                    <button 
                      className={`admin-filter-tab ${filterPlan === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterPlan('all')}
                    >
                      All Plans
                    </button>
                    {subscriptionPlans.map(plan => (
                      <button 
                        key={plan.id}
                        className={`admin-filter-tab ${filterPlan === plan.id ? 'active' : ''}`}
                        onClick={() => setFilterPlan(plan.id)}
                      >
                        {plan.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <Icon icon={['fas', 'spinner']} spin size="3x" />
                <p>Loading subscriptions...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="admin-empty-state">
                <Icon icon={['fas', 'credit-card']} size="4x" className="admin-empty-icon" />
                <h3>No companies found</h3>
                <p>No companies match your search criteria.</p>
              </div>
            ) : (
              <div className="admin-subscriptions-grid">
                {companies.map((company) => {
                  const plan = getSubscriptionPlan(company.subscriptionPlan) || {};
                  const features = company.subscriptionFeatures || {};
                  
                  return (
                    <div key={company.id} className="admin-subscription-card">
                      <div className="admin-subscription-header">
                        <h4>{company.companyName}</h4>
                        <div className="admin-subscription-badges">
                          {getStatusBadge(company.subscriptionStatus)}
                          {getPlanBadge(company.subscriptionPlan)}
                        </div>
                      </div>
                      
                      <div className="admin-subscription-details">
                        <div className="admin-subscription-detail">
                          <Icon icon={['fas', 'envelope']} />
                          <span>{company.email}</span>
                        </div>
                        <div className="admin-subscription-detail">
                          <Icon icon={['fas', 'calendar-alt']} />
                          <span>Started: {formatDate(company.subscriptionStartDate)}</span>
                        </div>
                        <div className="admin-subscription-detail">
                          <Icon icon={['fas', 'calendar-times']} />
                          <span>Expires: {formatDate(company.subscriptionEndDate)}</span>
                        </div>
                        {company.trialEndDate && (
                          <div className="admin-subscription-detail">
                            <Icon icon={['fas', 'clock']} />
                            <span>Trial Ends: {formatDate(company.trialEndDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="admin-subscription-features">
                        <div className="admin-feature-item">
                          <Icon icon={['fas', 'box']} />
                          <span>Packages: {formatLimit(features.maxPackages)}</span>
                        </div>
                        <div className="admin-feature-item">
                          <Icon icon={['fas', 'calendar-check']} />
                          <span>Bookings: {formatLimit(features.maxBookingsPerMonth)}/month</span>
                        </div>
                        <div className="admin-feature-item">
                          <Icon icon={['fas', 'image']} />
                          <span>Photos: {formatLimit(features.maxPhotosPerPackage)}/package</span>
                        </div>
                        {features.prioritySupport && (
                          <div className="admin-feature-item feature-enabled">
                            <Icon icon={['fas', 'headset']} />
                            <span>Priority Support</span>
                          </div>
                        )}
                        {features.analyticsAccess && (
                          <div className="admin-feature-item feature-enabled">
                            <Icon icon={['fas', 'chart-line']} />
                            <span>Analytics Access</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="admin-subscription-actions">
                        <button 
                          onClick={() => router.push(`/admin/company/${company.id}`)}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                        >
                          <Icon icon={['fas', 'eye']} />
                          View Profile
                        </button>
                        
                        {company.subscriptionStatus === 'active' && (
                          <>
                            <button 
                              onClick={() => handleSubscriptionUpdate(company.id, 'cancel')}
                              className="admin-btn admin-btn-sm admin-btn-danger"
                            >
                              <Icon icon={['fas', 'ban']} />
                              Cancel
                            </button>
                            <div className="admin-plan-dropdown">
                              <button className="admin-btn admin-btn-sm admin-btn-primary">
                                <Icon icon={['fas', 'exchange-alt']} />
                                Change Plan
                              </button>
                              <div className="admin-plan-dropdown-content">
                                {subscriptionPlans.map(planOption => (
                                  <button 
                                    key={planOption.id}
                                    onClick={() => handleSubscriptionUpdate(
                                      company.id, 
                                      planOption.price > plan.price ? 'upgrade' : 'downgrade', 
                                      planOption.id
                                    )}
                                    className="admin-plan-dropdown-item"
                                    disabled={planOption.id === company.subscriptionPlan}
                                  >
                                    {planOption.name} - ${planOption.price}/month
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {['cancelled', 'expired', 'inactive'].includes(company.subscriptionStatus) && (
                          <button 
                            onClick={() => handleSubscriptionUpdate(company.id, 'activate')}
                            className="admin-btn admin-btn-sm admin-btn-success"
                          >
                            <Icon icon={['fas', 'play']} />
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .admin-subscriptions-container {
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
            flex-wrap: wrap;
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

          .admin-subscriptions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .admin-subscription-card {
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            padding: 1.5rem;
            background: white;
            transition: all 0.3s;
          }

          .admin-subscription-card:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .admin-subscription-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .admin-subscription-header h4 {
            margin: 0;
            color: #1e293b;
            flex: 1;
          }

          .admin-subscription-badges {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .admin-subscription-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .admin-subscription-detail {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .admin-subscription-detail svg {
            color: #3b82f6;
            width: 14px;
          }

          .admin-subscription-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.5rem;
          }

          .admin-feature-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: #6b7280;
          }

          .admin-feature-item svg {
            width: 12px;
            color: #9ca3af;
          }

          .admin-feature-item.feature-enabled {
            color: #059669;
          }

          .admin-feature-item.feature-enabled svg {
            color: #059669;
          }

          .admin-subscription-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            position: relative;
          }

          .admin-plan-dropdown {
            position: relative;
            display: inline-block;
          }

          .admin-plan-dropdown-content {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 200px;
          }

          .admin-plan-dropdown:hover .admin-plan-dropdown-content {
            display: block;
          }

          .admin-plan-dropdown-item {
            display: block;
            width: 100%;
            padding: 0.75rem 1rem;
            text-align: left;
            border: none;
            background: white;
            cursor: pointer;
            transition: background 0.3s;
            font-size: 0.875rem;
          }

          .admin-plan-dropdown-item:hover {
            background: #f9fafb;
          }

          .admin-plan-dropdown-item:disabled {
            background: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
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

          .admin-badge-secondary {
            background: #f1f5f9;
            color: #475569;
          }

          .admin-plan-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            color: white;
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
            .admin-subscriptions-container {
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

            .admin-subscriptions-grid {
              grid-template-columns: 1fr;
            }

            .admin-subscription-actions {
              flex-direction: column;
            }

            .admin-subscription-features {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  );
}