import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import orderService from '@/services/orderService';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const response = await orderService.getOrders({ limit: 5 });
      setRecentOrders(response.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'customer-dash-status-badge pending', text: 'Pending', icon: '🕐' },
      confirmed: { class: 'customer-dash-status-badge confirmed', text: 'Confirmed', icon: '✓' },
      cancelled: { class: 'customer-dash-status-badge cancelled', text: 'Cancelled', icon: '✕' },
      completed: { class: 'customer-dash-status-badge completed', text: 'Completed', icon: '🎉' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="customer-dash-container">
          {/* Welcome Header */}
          <div className="customer-dash-header">
            <div className="customer-dash-header-content">
              <div className="customer-dash-header-text">
                <div className="customer-dash-welcome-badge">
                  <span className="customer-dash-badge-icon">🕌</span>
                  <span className="customer-dash-badge-text">Customer Dashboard</span>
                </div>
                <h1 className="customer-dash-header-title">
                  Welcome back, <span className="customer-dash-customer-name">{user?.name}</span>!
                </h1>
                <p className="customer-dash-header-subtitle">Ready for your next spiritual journey?</p>
              </div>
              <div className="customer-dash-header-stats">
                <div className="customer-dash-stat-item">
                  <span className="customer-dash-stat-number">{recentOrders.length}</span>
                  <span className="customer-dash-stat-label">Recent Orders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="customer-dash-actions-grid">
            <div className="customer-dash-action-card browse">
              <div className="customer-dash-action-header">
                <div className="customer-dash-action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="customer-dash-action-content">
                <h3 className="customer-dash-action-title">Browse Packages</h3>
                <p className="customer-dash-action-description">Explore our latest Umrah packages with premium accommodations</p>
                <Link href="/packages" className="customer-dash-action-button">
                  View Packages
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="customer-dash-action-card orders">
              <div className="customer-dash-action-header">
                <div className="customer-dash-action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="customer-dash-action-content">
                <h3 className="customer-dash-action-title">My Orders</h3>
                <p className="customer-dash-action-description">View and manage your bookings and travel plans</p>
                <Link href="/customer/orders" className="customer-dash-action-button">
                  View All Orders
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="customer-dash-action-card profile">
              <div className="customer-dash-action-header">
                <div className="customer-dash-action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="customer-dash-action-content">
                <h3 className="customer-dash-action-title">Profile</h3>
                <p className="customer-dash-action-description">Update your personal information and preferences</p>
                <Link href="/customer/profile" className="customer-dash-action-button secondary">
                  Edit Profile
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="customer-dash-orders-section">
            <div className="customer-dash-section-header">
              <div className="customer-dash-section-title">
                <h3>Recent Orders</h3>
                <p className="customer-dash-section-subtitle">Your latest booking activity</p>
              </div>
              <Link href="/customer/orders" className="customer-dash-view-all">
                View All
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="customer-dash-orders-content">
              {loading ? (
                <div className="customer-dash-loading-state">
                  <div className="customer-dash-loading-spinner"></div>
                  <span>Loading your orders...</span>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="customer-dash-empty-state">
                  <div className="customer-dash-empty-icon">📦</div>
                  <h3>No orders yet</h3>
                  <p>Start by browsing our amazing Umrah packages!</p>
                  <Link href="/packages" className="customer-dash-empty-action">
                    Browse Packages
                  </Link>
                </div>
              ) : (
                <div className="customer-dash-orders-list">
                  {recentOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <div key={order._id} className="customer-dash-order-item">
                        <div className="customer-dash-order-info">
                          <div className="customer-dash-order-header">
                            <span className="customer-dash-order-number">#{order.orderNumber}</span>
                            <div className={`customer-dash-order-status ${order.status}`}>
                              <span className="customer-dash-status-icon">{badge.icon}</span>
                              <span>{badge.text}</span>
                            </div>
                          </div>
                          <div className="customer-dash-order-details">
                            <div className="customer-dash-package-name">{order.package?.title}</div>
                            <div className="customer-dash-order-date">{formatDate(order.createdAt)}</div>
                          </div>
                        </div>
                        <div className="customer-dash-order-amount">${order.totalAmount}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
