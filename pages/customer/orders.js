import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import orderService from '@/services/orderService';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await orderService.getOrders(params);
      setOrders(response.orders);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'customer-orders-status-badge pending', text: 'Pending', icon: '🕐' },
      confirmed: { class: 'customer-orders-status-badge confirmed', text: 'Confirmed', icon: '✓' },
      cancelled: { class: 'customer-orders-status-badge cancelled', text: 'Cancelled', icon: '✕' },
      completed: { class: 'customer-orders-status-badge completed', text: 'Completed', icon: '🎉' }
    };
    return badges[status] || badges.pending;
  };

  const getFilterCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = !searchQuery || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.package?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="customer-orders-container">
          {/* Header */}
          <div className="customer-orders-header">
            <div className="customer-orders-header-content">
              <div className="customer-orders-header-text">
                <h1 className="customer-orders-header-title">My Orders</h1>
                <p className="customer-orders-header-subtitle">
                  Track and manage your Umrah package bookings
                </p>
              </div>
              <div className="customer-orders-header-stats">
                <div className="customer-orders-stat-item">
                  <span className="customer-orders-stat-number">{getFilterCount('pending')}</span>
                  <span className="customer-orders-stat-label">Pending</span>
                </div>
                <div className="customer-orders-stat-item">
                  <span className="customer-orders-stat-number">{getFilterCount('confirmed')}</span>
                  <span className="customer-orders-stat-label">Confirmed</span>
                </div>
                <div className="customer-orders-stat-item">
                  <span className="customer-orders-stat-number">{getFilterCount('all')}</span>
                  <span className="customer-orders-stat-label">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="customer-orders-controls">
            <div className="customer-orders-filter-tabs">
              {[
                { key: 'all', label: 'All Orders', count: getFilterCount('all') },
                { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
                { key: 'confirmed', label: 'Confirmed', count: getFilterCount('confirmed') },
                { key: 'cancelled', label: 'Cancelled', count: getFilterCount('cancelled') },
                { key: 'completed', label: 'Completed', count: getFilterCount('completed') }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`customer-orders-filter-tab ${filter === tab.key ? 'active' : ''}`}
                  onClick={() => setFilter(tab.key)}
                >
                  <span className="customer-orders-tab-label">{tab.label}</span>
                  <span className="customer-orders-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="customer-orders-search-controls">
              <div className="customer-orders-search-wrapper">
                <div className="customer-orders-search-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search orders or packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="customer-orders-search-input"
                />
              </div>
            </div>
          </div>

          {/* Orders Content */}
          <div className="customer-orders-content">
            {loading ? (
              <div className="customer-orders-loading-state">
                <div className="customer-orders-loading-spinner"></div>
                <span>Loading your orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="customer-orders-empty-state">
                <div className="customer-orders-empty-icon">📦</div>
                <h3>No orders found</h3>
                <p>
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : filter === 'all' 
                      ? 'You haven\'t made any bookings yet. Start by browsing our packages!'
                      : `No ${filter} orders at the moment.`
                  }
                </p>
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="customer-orders-btn-secondary"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link href="/packages" className="customer-orders-empty-action">
                    Browse Packages
                  </Link>
                )}
              </div>
            ) : (
              <div className="customer-orders-list">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="customer-orders-list-item">
                      <div className="customer-orders-item-info">
                        <div className="customer-orders-item-id">#{order.orderNumber}</div>
                        
                        <div className="customer-orders-item-content">
                          <h4 className="customer-orders-item-title">{order.package?.title}</h4>
                          <div className="customer-orders-item-date">{formatDate(order.createdAt)}</div>
                        </div>
                        
                        <div className="customer-orders-item-amount">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        
                        <div className={badge.class}>
                          <span className="customer-orders-status-icon">{badge.icon}</span>
                          <span className="customer-orders-status-text">{badge.text}</span>
                        </div>
                      </div>

                      <div className="customer-orders-item-actions">
                        <Link href={`/customer/orders/${order.id}`} className="customer-orders-item-view-btn">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}