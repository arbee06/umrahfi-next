import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import adminService from '@/services/adminService';
import Icon from '@/components/FontAwesome';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response.stats);
      setRecentActivity(response.recentActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="admin-dashboard-container">
          {/* Header */}
          <div className="admin-dashboard-header">
            <div className="admin-dashboard-header-content">
              <div className="admin-dashboard-header-text">
                <div className="admin-dashboard-welcome-badge">
                  <Icon icon={['fas', 'bolt']} className="admin-dashboard-badge-icon" />
                  <span className="admin-dashboard-badge-text">Admin Dashboard</span>
                </div>
                <h1 className="admin-dashboard-header-title">
                  System Overview
                </h1>
                <p className="admin-dashboard-header-subtitle">
                  Monitor platform performance and manage all operations
                </p>
              </div>
              <div className="admin-dashboard-header-actions">
                <Link href="/admin/users">
                  <button className="admin-dashboard-btn-header-primary">
                    <Icon icon="users" className="admin-dashboard-btn-icon" />
                    <span>Manage Users</span>
                  </button>
                </Link>
                <Link href="/admin/packages">
                  <button className="admin-dashboard-btn-header-primary">
                    <Icon icon="suitcase" className="admin-dashboard-btn-icon" />
                    <span>Manage Packages</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="admin-dashboard-stats-grid">
            <div className="admin-dashboard-stat-card users">
              <div className="admin-dashboard-stat-header">
                <div className="admin-dashboard-stat-icon">
                  <Icon icon="users" />
                </div>
                <div className="admin-dashboard-stat-menu">
                  <Link href="/admin/users">
                    <Icon icon="arrow-right" />
                  </Link>
                </div>
              </div>
              <div className="admin-dashboard-stat-content">
                <div className="admin-dashboard-stat-number">
                  {loading ? (
                    <div className="admin-dashboard-stat-loading"></div>
                  ) : (
                    stats?.users.total || 0
                  )}
                </div>
                <div className="admin-dashboard-stat-label">Total Users</div>
                <div className="admin-dashboard-stat-sublabel">
                  {stats?.users.customers || 0} customers, {stats?.users.companies || 0} companies
                </div>
              </div>
            </div>

            <div className="admin-dashboard-stat-card packages">
              <div className="admin-dashboard-stat-header">
                <div className="admin-dashboard-stat-icon">
                  <Icon icon="suitcase" />
                </div>
                <div className="admin-dashboard-stat-menu">
                  <Link href="/packages">
                    <Icon icon="arrow-right" />
                  </Link>
                </div>
              </div>
              <div className="admin-dashboard-stat-content">
                <div className="admin-dashboard-stat-number">
                  {loading ? (
                    <div className="admin-dashboard-stat-loading"></div>
                  ) : (
                    stats?.packages.total || 0
                  )}
                </div>
                <div className="admin-dashboard-stat-label">Total Packages</div>
                <div className="admin-dashboard-stat-sublabel">
                  {stats?.packages.active || 0} active packages
                </div>
              </div>
            </div>

            <div className="admin-dashboard-stat-card orders">
              <div className="admin-dashboard-stat-header">
                <div className="admin-dashboard-stat-icon">
                  <Icon icon="file-alt" />
                </div>
                <div className="admin-dashboard-stat-trend neutral">
                  <span className="trend-value">
                    <Icon icon="clock" />
                    {stats?.orders.pending || 0} pending
                  </span>
                </div>
              </div>
              <div className="admin-dashboard-stat-content">
                <div className="admin-dashboard-stat-number">
                  {loading ? (
                    <div className="admin-dashboard-stat-loading"></div>
                  ) : (
                    stats?.orders.total || 0
                  )}
                </div>
                <div className="admin-dashboard-stat-label">Total Orders</div>
                <div className="admin-dashboard-stat-sublabel">
                  {stats?.orders.confirmed || 0} confirmed orders
                </div>
              </div>
            </div>

            <div className="admin-dashboard-stat-card revenue">
              <div className="admin-dashboard-stat-header">
                <div className="admin-dashboard-stat-icon">
                  <Icon icon="dollar-sign" />
                </div>
              </div>
              <div className="admin-dashboard-stat-content">
                <div className="admin-dashboard-stat-number">
                  {loading ? (
                    <div className="admin-dashboard-stat-loading"></div>
                  ) : (
                    formatCurrency(stats?.revenue.total || 0)
                  )}
                </div>
                <div className="admin-dashboard-stat-label">Total Revenue</div>
                <div className="admin-dashboard-stat-sublabel">
                  From confirmed bookings
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="admin-dashboard-grid">
            {/* Recent Users */}
            <div className="admin-dashboard-card recent-users">
              <div className="admin-dashboard-card-header">
                <div className="admin-dashboard-card-title">
                  <h3>Recent Users</h3>
                  <span className="admin-dashboard-card-subtitle">Latest registrations</span>
                </div>
                <Link href="/admin/users" className="admin-dashboard-card-action">
                  View All
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              
              <div className="admin-dashboard-card-content">
                {loading ? (
                  <div className="admin-dashboard-loading-state">
                    <div className="admin-dashboard-loading-spinner"></div>
                    <span>Loading recent users...</span>
                  </div>
                ) : recentActivity?.users.length === 0 ? (
                  <div className="admin-dashboard-empty-state">
                    <div className="admin-dashboard-empty-icon">
                      <Icon icon={['fas', 'users']} />
                    </div>
                    <h4>No recent users</h4>
                    <p>New user registrations will appear here.</p>
                  </div>
                ) : (
                  <div className="admin-dashboard-users-list">
                    {recentActivity?.users.map((user) => (
                      <div key={user.id} className="admin-dashboard-user-item">
                        <div className="admin-dashboard-user-info">
                          <div className="admin-dashboard-user-header">
                            <span className="admin-dashboard-user-name">{user.name}</span>
                            <span className={`admin-dashboard-role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="admin-dashboard-user-details">
                            <span className="admin-dashboard-user-email">{user.email}</span>
                            <span className="admin-dashboard-user-date">{formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="admin-dashboard-card recent-orders">
              <div className="admin-dashboard-card-header">
                <div className="admin-dashboard-card-title">
                  <h3>Recent Orders</h3>
                  <span className="admin-dashboard-card-subtitle">Latest booking activity</span>
                </div>
                <div className="admin-dashboard-card-action">
                  View All
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
              
              <div className="admin-dashboard-card-content">
                {loading ? (
                  <div className="admin-dashboard-loading-state">
                    <div className="admin-dashboard-loading-spinner"></div>
                    <span>Loading recent orders...</span>
                  </div>
                ) : recentActivity?.orders.length === 0 ? (
                  <div className="admin-dashboard-empty-state">
                    <div className="admin-dashboard-empty-icon">
                      <Icon icon={['fas', 'clipboard-list']} />
                    </div>
                    <h4>No recent orders</h4>
                    <p>New orders will appear here.</p>
                  </div>
                ) : (
                  <div className="admin-dashboard-orders-list">
                    {recentActivity?.orders.map((order) => (
                      <div key={order.id} className="admin-dashboard-order-item">
                        <div className="admin-dashboard-order-info">
                          <div className="admin-dashboard-order-header">
                            <span className="admin-dashboard-order-number">#{order.orderNumber}</span>
                            <span className={`admin-dashboard-status-badge ${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="admin-dashboard-order-details">
                            <span className="admin-dashboard-customer-name">{order.customer?.name}</span>
                            <span className="admin-dashboard-package-name">{order.package?.title}</span>
                            <span className="admin-dashboard-order-date">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="admin-dashboard-order-amount">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-dashboard-card quick-actions">
            <div className="admin-dashboard-card-header">
              <div className="admin-dashboard-card-title">
                <h3>Quick Actions</h3>
                <span className="admin-dashboard-card-subtitle">Common administrative tasks</span>
              </div>
            </div>
            
            <div className="admin-dashboard-card-content">
              <div className="admin-dashboard-actions-grid">
                <Link href="/admin/users" className="admin-dashboard-action-item primary">
                  <div className="admin-dashboard-action-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="admin-dashboard-action-content">
                    <span className="admin-dashboard-action-title">Manage Users</span>
                    <span className="admin-dashboard-action-subtitle">View and manage all users</span>
                  </div>
                </Link>

                <Link href="/admin/packages" className="admin-dashboard-action-item">
                  <div className="admin-dashboard-action-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="admin-dashboard-action-content">
                    <span className="admin-dashboard-action-title">Manage Packages</span>
                    <span className="admin-dashboard-action-subtitle">Review company packages</span>
                  </div>
                </Link>

                <div className="admin-dashboard-action-item">
                  <div className="admin-dashboard-action-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="admin-dashboard-action-content">
                    <span className="admin-dashboard-action-title">System Reports</span>
                    <span className="admin-dashboard-action-subtitle">Generate analytics</span>
                  </div>
                </div>

                <div className="admin-dashboard-action-item">
                  <div className="admin-dashboard-action-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="admin-dashboard-action-content">
                    <span className="admin-dashboard-action-title">System Settings</span>
                    <span className="admin-dashboard-action-subtitle">Configure platform</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}