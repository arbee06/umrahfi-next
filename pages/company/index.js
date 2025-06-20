import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import packageService from '@/services/packageService';
import orderService from '@/services/orderService';
import Icon from '@/components/FontAwesome';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch packages
      const packagesResponse = await packageService.getPackages({ 
        company: user.id,
        limit: 100 
      });
      
      // Fetch orders
      const ordersResponse = await orderService.getOrders({ 
        limit: 100 
      });

      // Calculate stats
      const packages = packagesResponse.packages || [];
      const orders = ordersResponse.orders || [];
      
      console.log('Orders data:', orders);
      console.log('Sample order:', orders[0]);
      
      const revenue = orders.length > 0 ? orders.reduce((sum, order) => {
        // Only count completed orders for revenue
        if (order.status === 'completed') {
          const amount = parseFloat(order.totalAmount) || 0;
          console.log('Completed order amount:', order.totalAmount, 'Parsed:', amount);
          return sum + amount;
        }
        return sum;
      }, 0) : 0;
      
      console.log('Total revenue:', revenue);

      setStats({
        totalPackages: packages.length,
        activePackages: packages.filter(p => p.status === 'active').length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        revenue,
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'company-orders-status-badge pending', text: 'Pending' },
      confirmed: { class: 'company-orders-status-badge confirmed', text: 'Confirmed' },
      cancelled: { class: 'company-orders-status-badge cancelled', text: 'Cancelled' },
      completed: { class: 'company-orders-status-badge completed', text: 'Completed' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="company-dashboard-container">
          {/* Header */}
          <div className="company-dashboard-header">
            <div className="company-dashboard-header-content">
              <div className="company-dashboard-header-text">
                <div className="company-dashboard-welcome-badge">
                  <span className="company-dashboard-badge-icon">🏢</span>
                  <span className="company-dashboard-badge-text">Company Dashboard</span>
                </div>
                <h1 className="company-dashboard-header-title">
                  Welcome back, <span className="company-dashboard-company-name">{user?.companyName || user?.name}</span>
                </h1>
                <p className="company-dashboard-header-subtitle">
                  Manage your Umrah packages and track your business performance
                </p>
              </div>
              <div className="company-dashboard-header-actions">
                <Link href="/company/packages/create">
                  <button className="company-dashboard-btn-header-primary">
                    <Icon icon="plus" className="company-dashboard-btn-icon" />
                    <span>New Package</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="company-dashboard-stats-grid">
            <div className="company-dashboard-stat-card packages">
              <div className="company-dashboard-stat-header">
                <div className="company-dashboard-stat-icon">
                  <Icon icon="suitcase" />
                </div>
                <div className="company-dashboard-stat-menu">
                  <Link href="/company/packages">
                    <Icon icon="arrow-right" />
                  </Link>
                </div>
              </div>
              <div className="company-dashboard-stat-content">
                <div className="company-dashboard-stat-number">
                  {loading ? (
                    <div className="company-dashboard-stat-loading"></div>
                  ) : (
                    stats.totalPackages
                  )}
                </div>
                <div className="company-dashboard-stat-label">Total Packages</div>
                <div className="company-dashboard-stat-sublabel">
                  {stats.activePackages} active packages
                </div>
              </div>
            </div>

            <div className="company-dashboard-stat-card orders">
              <div className="company-dashboard-stat-header">
                <div className="company-dashboard-stat-icon">
                  <Icon icon="file-alt" />
                </div>
                <div className="company-dashboard-stat-menu">
                  <Link href="/company/orders">
                    <Icon icon="arrow-right" />
                  </Link>
                </div>
              </div>
              <div className="company-dashboard-stat-content">
                <div className="company-dashboard-stat-number">
                  {loading ? (
                    <div className="company-dashboard-stat-loading"></div>
                  ) : (
                    stats.totalOrders
                  )}
                </div>
                <div className="company-dashboard-stat-label">Total Orders</div>
                <div className="company-dashboard-stat-sublabel">
                  {stats.pendingOrders} pending review
                </div>
              </div>
            </div>

            <div className="company-dashboard-stat-card revenue">
              <div className="company-dashboard-stat-header">
                <div className="company-dashboard-stat-icon">
                  <Icon icon="dollar-sign" />
                </div>
                <div className="company-dashboard-stat-trend positive">
                  <Icon icon="arrow-up" />
                </div>
              </div>
              <div className="company-dashboard-stat-content">
                <div className="company-dashboard-stat-number">
                  {loading ? (
                    <div className="company-dashboard-stat-loading"></div>
                  ) : (
                    formatCurrency(stats.revenue)
                  )}
                </div>
                <div className="company-dashboard-stat-label">Total Revenue</div>
                <div className="company-dashboard-stat-sublabel">
                  From completed orders
                </div>
              </div>
            </div>

            <div className="company-dashboard-stat-card performance">
              <div className="company-dashboard-stat-header">
                <div className="company-dashboard-stat-icon">
                  <Icon icon="chart-bar" />
                </div>
                <div className="company-dashboard-stat-trend neutral">
                  <span className="trend-value">4.8<Icon icon="star" /></span>
                </div>
              </div>
              <div className="company-dashboard-stat-content">
                <div className="company-dashboard-stat-number">
                  {loading ? (
                    <div className="company-dashboard-stat-loading"></div>
                  ) : (
                    Math.round((stats.activePackages / Math.max(stats.totalPackages, 1)) * 100)
                  )}%
                </div>
                <div className="company-dashboard-stat-label">Active Rate</div>
                <div className="company-dashboard-stat-sublabel">
                  Package performance
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="company-dashboard-grid">
            {/* Recent Orders */}
            <div className="company-dashboard-card recent-orders">
              <div className="company-dashboard-card-header">
                <div className="company-dashboard-card-title">
                  <h3>Recent Orders</h3>
                  <span className="company-dashboard-card-subtitle">Latest booking requests</span>
                </div>
                <Link href="/company/orders" className="company-dashboard-card-action">
                  View All
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              
              <div className="company-dashboard-card-content">
                {loading ? (
                  <div className="company-dashboard-loading-state">
                    <div className="company-dashboard-loading-spinner"></div>
                    <span>Loading recent orders...</span>
                  </div>
                ) : stats.recentOrders.length === 0 ? (
                  <div className="company-dashboard-empty-state">
                    <div className="company-dashboard-empty-icon">📋</div>
                    <h4>No recent orders</h4>
                    <p>When customers book your packages, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="company-dashboard-orders-list">
                    {stats.recentOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <div key={order.id} className="company-dashboard-order-item">
                          <div className="company-dashboard-order-info">
                            <div className="company-dashboard-order-header">
                              <span className="company-dashboard-order-number">#{order.orderNumber}</span>
                              <span className={badge.class}>{badge.text}</span>
                            </div>
                            <div className="company-dashboard-order-details">
                              <span className="company-dashboard-customer-name">{order.customer?.name}</span>
                              <span className="company-dashboard-order-package">{order.package?.title}</span>
                              <span className="company-dashboard-order-date">{formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                          <div className="company-dashboard-order-amount">
                            {formatCurrency(order.totalAmount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="company-dashboard-card quick-actions">
              <div className="company-dashboard-card-header">
                <div className="company-dashboard-card-title">
                  <h3>Quick Actions</h3>
                  <span className="company-dashboard-card-subtitle">Common tasks</span>
                </div>
              </div>
              
              <div className="company-dashboard-card-content">
                <div className="company-dashboard-actions-grid">
                  <Link href="/company/packages/create" className="company-dashboard-action-item primary">
                    <div className="company-dashboard-action-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="company-dashboard-action-content">
                      <span className="company-dashboard-action-title">Create Package</span>
                      <span className="company-dashboard-action-subtitle">Add new Umrah package</span>
                    </div>
                  </Link>

                  <Link href="/company/packages" className="company-dashboard-action-item">
                    <div className="company-dashboard-action-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="company-dashboard-action-content">
                      <span className="company-dashboard-action-title">Manage Packages</span>
                      <span className="company-dashboard-action-subtitle">Edit existing packages</span>
                    </div>
                  </Link>

                  <Link href="/company/orders" className="company-dashboard-action-item">
                    <div className="company-dashboard-action-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="company-dashboard-action-content">
                      <span className="company-dashboard-action-title">Review Orders</span>
                      <span className="company-dashboard-action-subtitle">Process bookings</span>
                    </div>
                  </Link>

                  <Link href="/company/profile" className="company-dashboard-action-item">
                    <div className="company-dashboard-action-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="company-dashboard-action-content">
                      <span className="company-dashboard-action-title">Company Profile</span>
                      <span className="company-dashboard-action-subtitle">Update information</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="company-dashboard-card company-dashboard-getting-started">
            <div className="company-dashboard-card-header">
              <div className="company-dashboard-card-title">
                <h3>Getting Started Guide</h3>
                <span className="company-dashboard-card-subtitle">Essential steps to grow your business</span>
              </div>
            </div>
            
            <div className="company-dashboard-card-content">
              <div className="company-dashboard-guide-grid">
                <div className="company-dashboard-guide-item">
                  <div className="company-dashboard-guide-step">1</div>
                  <div className="company-dashboard-guide-content">
                    <h4>Create Attractive Packages</h4>
                    <p>Design compelling Umrah packages with detailed itineraries, competitive pricing, and clear inclusions.</p>
                  </div>
                  <div className="company-dashboard-guide-status completed">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="company-dashboard-guide-item">
                  <div className="company-dashboard-guide-step">2</div>
                  <div className="company-dashboard-guide-content">
                    <h4>Keep Availability Updated</h4>
                    <p>Regularly update your package availability and pricing to ensure accurate information for customers.</p>
                  </div>
                  <div className="company-dashboard-guide-status pending">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="company-dashboard-guide-item">
                  <div className="company-dashboard-guide-step">3</div>
                  <div className="company-dashboard-guide-content">
                    <h4>Respond to Bookings Promptly</h4>
                    <p>Quick response times improve customer satisfaction and increase your booking conversion rate.</p>
                  </div>
                  <div className="company-dashboard-guide-status pending">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="company-dashboard-guide-item">
                  <div className="company-dashboard-guide-step">4</div>
                  <div className="company-dashboard-guide-content">
                    <h4>Maintain Accurate Profile</h4>
                    <p>Keep your company information, contact details, and certifications up to date for customer trust.</p>
                  </div>
                  <div className="company-dashboard-guide-status pending">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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