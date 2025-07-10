import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import orderService from '@/services/orderService';
import Icon from '@/components/FontAwesome';

// Review Button Component with individual review checking
function ReviewButton({ orderId, hasReview, onWriteReview }) {
  const [reviewExists, setReviewExists] = useState(hasReview);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If we don't have review status from parent, check individually
    if (hasReview === undefined && !checking) {
      setChecking(true);
      checkReviewExists();
    } else {
      setReviewExists(hasReview);
    }
  }, [hasReview, orderId]);

  const checkReviewExists = async () => {
    try {
      const response = await fetch(`/api/reviews?orderId=${orderId}`);
      if (response.ok) {
        const reviews = await response.json();
        setReviewExists(reviews.length > 0);
      } else {
        setReviewExists(false);
      }
    } catch (error) {
      console.error('Error checking review:', error);
      setReviewExists(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="customer-orders-action-btn review checking">
        <Icon icon={['fas', 'spinner']} spin />
        <span>Checking...</span>
      </div>
    );
  }

  if (reviewExists) {
    return null; // Don't show anything if review exists
  }

  return (
    <Link 
      href={`/customer/orders/${orderId}/review`} 
      className="customer-orders-action-btn review"
      onClick={onWriteReview}
    >
      <Icon icon={['fas', 'star']} />
      <span>Write Review</span>
    </Link>
  );
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);
  const [orderReviews, setOrderReviews] = useState(new Map()); // Track which orders have reviews

  useEffect(() => {
    fetchOrders();
  }, []); // Remove filter dependency

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Always fetch all orders, filtering will be done client-side
      const response = await orderService.getOrders();
      setOrders(response.orders);
      
      // For completed orders, check if reviews exist
      const completedOrders = response.orders.filter(order => order.status === 'completed');
      const reviewsMap = new Map();
      
      await Promise.all(completedOrders.map(async (order) => {
        try {
          console.log(`Checking reviews for order ${order.id}...`);
          const reviewResponse = await fetch(`/api/reviews?orderId=${order.id}`);
          console.log(`Review response status for order ${order.id}:`, reviewResponse.status);
          
          if (reviewResponse.ok) {
            const reviews = await reviewResponse.json();
            console.log(`Reviews found for order ${order.id}:`, reviews);
            const hasReview = reviews.length > 0;
            reviewsMap.set(order.id, hasReview);
            console.log(`Order ${order.id} has review:`, hasReview);
          } else {
            console.log(`Failed to fetch reviews for order ${order.id}`);
            reviewsMap.set(order.id, false);
          }
        } catch (error) {
          console.error('Error checking review for order', order.id, error);
          reviewsMap.set(order.id, false);
        }
      }));
      
      setOrderReviews(reviewsMap);
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
      draft: { class: 'customer-orders-status-badge draft', text: 'Payment Required', icon: 'credit-card' },
      pending: { class: 'customer-orders-status-badge pending', text: 'Pending', icon: 'clock' },
      confirmed: { class: 'customer-orders-status-badge confirmed', text: 'Confirmed', icon: 'check' },
      cancelled: { class: 'customer-orders-status-badge cancelled', text: 'Cancelled', icon: 'times' },
      completed: { class: 'customer-orders-status-badge completed', text: 'Completed', icon: 'check-circle' }
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const badges = {
      pending: { class: 'customer-orders-payment-badge pending', text: 'Payment Pending', icon: 'clock' },
      completed: { class: 'customer-orders-payment-badge completed', text: 'Paid', icon: 'check-circle' },
      partial: { class: 'customer-orders-payment-badge partial', text: 'Partial', icon: 'hourglass-half' },
      refunded: { class: 'customer-orders-payment-badge refunded', text: 'Refunded', icon: 'undo' }
    };
    return badges[paymentStatus] || badges.pending;
  };

  const calculateDuration = (order) => {
    if (order.package?.duration) {
      return `${order.package.duration} days`;
    }
    
    if (order.package?.departureDate && order.package?.returnDate) {
      const departure = new Date(order.package.departureDate);
      const returnDate = new Date(order.package.returnDate);
      const diffTime = Math.abs(returnDate - departure);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    }
    
    // Default duration for Umrah packages
    return '14 days';
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
                { key: 'draft', label: 'Payment Required', count: getFilterCount('draft') },
                { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
                { key: 'confirmed', label: 'Confirmed', count: getFilterCount('confirmed') },
                { key: 'cancelled', label: 'Cancelled', count: getFilterCount('cancelled') },
                { key: 'completed', label: 'Completed', count: getFilterCount('completed') }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`customer-orders-filter-tab ${filter === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setFilterLoading(true);
                    setFilter(tab.key);
                    // Quick visual feedback - reset after animation
                    setTimeout(() => setFilterLoading(false), 300);
                  }}
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
                <div className="customer-orders-empty-icon">
                  <Icon icon={['fas', 'box']} />
                </div>
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
              <div className={`customer-orders-list ${filterLoading ? 'filtering' : ''}`}>
                {filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
                  return (
                    <div key={order.id} className="customer-orders-card">
                      {/* Order Header */}
                      <div className="customer-orders-card-header">
                        <div className="customer-orders-card-meta">
                          <div className="customer-orders-card-id">#{order.orderNumber}</div>
                          <div className="customer-orders-card-date">
                            <Icon icon={['fas', 'calendar-alt']} />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="customer-orders-card-status">
                          <div className={statusBadge.class}>
                            <Icon icon={['fas', statusBadge.icon]} />
                            <span>{statusBadge.text}</span>
                          </div>
                        </div>
                      </div>

                      {/* Package Info */}
                      <div className="customer-orders-card-content">
                        <div className="customer-orders-package-info">
                          <h3 className="customer-orders-package-title">{order.package?.title}</h3>
                          <div className="customer-orders-package-details">
                            <div className="customer-orders-detail-item">
                              <Icon icon={['fas', 'calendar-check']} />
                              <span>Departure: {order.package?.departureDate ? new Date(order.package.departureDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="customer-orders-detail-item">
                              <Icon icon={['fas', 'users']} />
                              <span>{order.travelers?.length || (order.numberOfAdults || 0) + (order.numberOfChildren || 0) || order.numberOfTravelers || 1} travelers</span>
                            </div>
                            <div className="customer-orders-detail-item">
                              <Icon icon={['fas', 'clock']} />
                              <span>{calculateDuration(order)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="customer-orders-price-section">
                          <div className="customer-orders-price">
                            <span className="customer-orders-price-label">Total Amount</span>
                            <span className="customer-orders-price-value">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          {(order.status === 'draft' || order.paymentStatus === 'pending') && (
                            <div className={`customer-orders-payment-status ${paymentBadge.class}`}>
                              <Icon icon={['fas', paymentBadge.icon]} />
                              <span>{paymentBadge.text}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="customer-orders-card-actions">
                        <Link href={`/customer/orders/${order.id}`} className="customer-orders-action-btn primary">
                          <Icon icon={['fas', 'eye']} />
                          <span>View Details</span>
                        </Link>
                        {order.status === 'completed' && (
                          <ReviewButton 
                            orderId={order.id}
                            hasReview={orderReviews.get(order.id)}
                            onWriteReview={() => {
                              if (typeof window !== 'undefined') {
                                sessionStorage.setItem('reviewBackPath', '/customer/orders');
                              }
                            }}
                          />
                        )}
                        {order.status === 'draft' && (
                          <Link href={`/customer/book/${order.packageId}?completeOrder=${order.id}`} className="customer-orders-action-btn payment">
                            <Icon icon={['fas', 'credit-card']} />
                            <span>Complete Payment</span>
                          </Link>
                        )}
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