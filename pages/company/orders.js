// File: pages\company\orders.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import orderService from '@/services/orderService';
import Swal from 'sweetalert2';
import Icon from '@/components/FontAwesome';

export default function CompanyOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [processingOrders, setProcessingOrders] = useState(new Set());

  useEffect(() => {
    fetchOrders();
  }, []); // Only fetch once when component mounts

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrders({ limit: 1000 }); // Fetch all orders
      setAllOrders(response.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const statusLabels = {
      confirmed: 'Confirm',
      cancelled: 'Cancel',
      completed: 'Complete'
    };
    
    const statusMessages = {
      confirmed: { title: 'Confirm Order?', message: 'This will notify the customer that their booking is confirmed.' },
      cancelled: { title: 'Cancel Order?', message: 'This will cancel the booking and may trigger refund processes.' },
      completed: { title: 'Mark as Completed?', message: 'This indicates the service has been fully delivered.' }
    };
    
    const statusColors = {
      confirmed: '#10b981',
      cancelled: '#ef4444',
      completed: '#8b5cf6'
    };
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: statusMessages[newStatus]?.title || 'Update Order Status?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">Order:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${order.orderNumber}</p>
          <p style="color: #6b7280; margin-bottom: 1rem;">${order.package?.title || 'Package details'}</p>
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #6b7280; margin: 0;">${statusMessages[newStatus]?.message || 'This will update the order status.'}</p>
          </div>
        </div>
      `,
      icon: newStatus === 'cancelled' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: statusColors[newStatus] || '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${statusLabels[newStatus]}`,
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
    
    // Add order to processing set to show loading state
    setProcessingOrders(prev => new Set(prev).add(orderId));
    
    try {
      await orderService.updateOrder(orderId, { status: newStatus });
      
      // Update local state instead of refetching
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      const successMessages = {
        confirmed: 'Order confirmed successfully!',
        cancelled: 'Order cancelled successfully!',
        completed: 'Order marked as completed!'
      };
      
      // Show success toast
      Swal.fire({
        title: 'Updated!',
        text: successMessages[newStatus] || 'Order updated successfully!',
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
        text: 'Failed to update order status: ' + (error.error || 'Unknown error'),
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
    } finally {
      // Remove order from processing set
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'company-orders-status-badge draft', text: 'Payment Required', icon: 'credit-card' },
      pending: { class: 'company-orders-status-badge pending', text: 'Pending', icon: 'clock' },
      confirmed: { class: 'company-orders-status-badge confirmed', text: 'Confirmed', icon: 'check-circle' },
      cancelled: { class: 'company-orders-status-badge cancelled', text: 'Cancelled', icon: 'times-circle' },
      completed: { class: 'company-orders-status-badge completed', text: 'Completed', icon: 'check' }
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const badges = {
      pending: { class: 'company-orders-payment-badge pending', text: 'Payment Pending', icon: 'clock' },
      completed: { class: 'company-orders-payment-badge completed', text: 'Paid', icon: 'check-circle' },
      partial: { class: 'company-orders-payment-badge partial', text: 'Partial', icon: 'hourglass-half' },
      refunded: { class: 'company-orders-payment-badge refunded', text: 'Refunded', icon: 'undo' }
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

  const filteredOrders = allOrders
    .filter(order => {
      // Filter by status
      if (filter !== 'all' && order.status !== filter) {
        return false;
      }
      
      // Filter by search query
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.email?.toLowerCase().includes(query) ||
        order.package?.title?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  const getFilterCount = (status) => {
    if (status === 'all') return allOrders.length;
    return allOrders.filter(order => order.status === status).length;
  };

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="company-orders-container">
          {/* Header */}
          <div className="company-orders-header">
            <div className="company-orders-header-content">
              <div className="company-orders-header-text">
                <h1 className="company-orders-header-title">Orders Management</h1>
                <p className="company-orders-header-subtitle">
                  Track and manage customer bookings for your packages
                </p>
              </div>
              <div className="company-orders-header-stats">
                <div className="company-orders-stat-item">
                  <span className="company-orders-stat-number">{getFilterCount('pending')}</span>
                  <span className="company-orders-stat-label">Pending</span>
                </div>
                <div className="company-orders-stat-item">
                  <span className="company-orders-stat-number">{getFilterCount('confirmed')}</span>
                  <span className="company-orders-stat-label">Confirmed</span>
                </div>
                <div className="company-orders-stat-item">
                  <span className="company-orders-stat-number">{getFilterCount('all')}</span>
                  <span className="company-orders-stat-label">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="company-orders-controls">
            <div className="company-orders-filter-tabs">
              {[
                { key: 'all', label: 'All Orders', count: getFilterCount('all') },
                { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
                { key: 'confirmed', label: 'Confirmed', count: getFilterCount('confirmed') },
                { key: 'cancelled', label: 'Cancelled', count: getFilterCount('cancelled') },
                { key: 'completed', label: 'Completed', count: getFilterCount('completed') }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`company-orders-filter-tab ${filter === tab.key ? 'active' : ''}`}
                  onClick={() => setFilter(tab.key)}
                >
                  <span className="company-orders-tab-label">{tab.label}</span>
                  <span className="company-orders-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="company-orders-search-controls">
              <div className="company-orders-search-wrapper">
                <div className="company-orders-search-icon">
                  <Icon icon="search" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders, customers, or packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="company-orders-search-input"
                />
              </div>

              <div className="company-orders-sort-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="company-orders-sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="company-orders-content">
            {loading ? (
              <div className="company-orders-loading-state">
                <div className="company-orders-loading-spinner"></div>
                <span>Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="company-orders-empty-state">
                <div className="company-orders-empty-icon"><Icon icon="file-alt" style={{fontSize: '2rem'}} /></div>
                <h3>No orders found</h3>
                <p>
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : filter === 'all' 
                      ? 'When customers book your packages, orders will appear here.'
                      : `No ${filter} orders at the moment.`
                  }
                </p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="company-orders-btn-secondary"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="company-orders-list">
                {filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
                  return (
                    <div key={order.id} className="company-orders-card">
                      {/* Order Header */}
                      <div className="company-orders-card-header">
                        <div className="company-orders-card-meta">
                          <div className="company-orders-card-id">#{order.orderNumber}</div>
                          <div className="company-orders-card-date">
                            <Icon icon={['fas', 'calendar-alt']} />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="company-orders-card-status">
                          <div className={statusBadge.class}>
                            <Icon icon={['fas', statusBadge.icon]} />
                            <span>{statusBadge.text}</span>
                          </div>
                        </div>
                      </div>

                      {/* Package & Customer Info */}
                      <div className="company-orders-card-content">
                        <div className="company-orders-package-info">
                          <h3 className="company-orders-package-title">{order.package?.title}</h3>
                          <div className="company-orders-package-details">
                            <div className="company-orders-detail-item">
                              <Icon icon={['fas', 'user']} />
                              <span>Customer: {order.customer?.name}</span>
                            </div>
                            <div className="company-orders-detail-item">
                              <Icon icon={['fas', 'calendar-check']} />
                              <span>Departure: {order.package?.departureDate ? new Date(order.package.departureDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="company-orders-detail-item">
                              <Icon icon={['fas', 'users']} />
                              <span>{order.travelers?.length || (order.numberOfAdults || 0) + (order.numberOfChildren || 0) || order.numberOfTravelers || 1} travelers</span>
                            </div>
                            <div className="company-orders-detail-item">
                              <Icon icon={['fas', 'clock']} />
                              <span>{calculateDuration(order)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="company-orders-price-section">
                          <div className="company-orders-price">
                            <span className="company-orders-price-label">Total Amount</span>
                            <span className="company-orders-price-value">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          {(order.status === 'draft' || order.paymentStatus === 'pending') && (
                            <div className={`company-orders-payment-status ${paymentBadge.class}`}>
                              <Icon icon={['fas', paymentBadge.icon]} />
                              <span>{paymentBadge.text}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="company-orders-card-actions">
                        <Link href={`/company/orders/${order.id}`} className="company-orders-action-btn primary">
                          <Icon icon={['fas', 'eye']} />
                          <span>View Details</span>
                        </Link>

                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <div className="company-orders-card-actions-secondary">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                  className="company-orders-action-btn confirm"
                                  disabled={processingOrders.has(order.id)}
                                >
                                  {processingOrders.has(order.id) ? (
                                    <>
                                      <Icon icon={['fas', 'spinner']} spin />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon={['fas', 'check']} />
                                      <span>Confirm</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                  className="company-orders-action-btn cancel"
                                  disabled={processingOrders.has(order.id)}
                                >
                                  {processingOrders.has(order.id) ? (
                                    <>
                                      <Icon icon={['fas', 'spinner']} spin />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon={['fas', 'times']} />
                                      <span>Cancel</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                            {order.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                className="company-orders-action-btn complete"
                                disabled={processingOrders.has(order.id)}
                              >
                                {processingOrders.has(order.id) ? (
                                  <>
                                    <Icon icon={['fas', 'spinner']} spin />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Icon icon={['fas', 'check-circle']} />
                                    <span>Complete</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
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