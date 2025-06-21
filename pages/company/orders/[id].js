import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import orderService from '@/services/orderService';
import Swal from 'sweetalert2';

export default function CompanyOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalTitle, setImageModalTitle] = useState('Image');

  useEffect(() => {
    if (!router.isReady) return;
    
    if (id) {
      fetchOrderDetails(id);
    } else {
      setLoading(false);
    }
  }, [router.isReady, id]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await orderService.getOrderById(orderId);
      setOrder(response.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
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
          <p style="color: #6b7280; font-size: 0.9rem;">Customer will be notified of this status change.</p>
        </div>
      `,
      icon: newStatus === 'cancelled' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: statusColors[newStatus] || '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${statusLabels[newStatus]} Order`,
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
    
    setUpdating(true);
    
    // Show loading state
    Swal.fire({
      title: `${statusLabels[newStatus]}ing Order...`,
      html: 'Please wait while we update the order status.',
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
      // Prepare update data
      const updateData = { status: newStatus };
      
      // Update payment status when confirming order
      if (newStatus === 'confirmed') {
        updateData.paymentStatus = 'paid';
      }
      
      await orderService.updateOrder(order.id, updateData);
      
      // Update local state
      const updatedOrder = { 
        ...order, 
        status: newStatus,
        ...(newStatus === 'confirmed' && { paymentStatus: 'paid' })
      };
      setOrder(updatedOrder);
      
      const successMessages = {
        confirmed: 'Order confirmed and payment verified!',
        cancelled: 'Order cancelled successfully!',
        completed: 'Order marked as completed!'
      };
      
      // Show success message
      await Swal.fire({
        title: 'Status Updated!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: ${statusColors[newStatus]}; font-weight: 600; margin-bottom: 1rem;">${successMessages[newStatus]}</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Order Number:</p>
            <p style="font-weight: 600; color: #1f2937; font-family: monospace;">${order.orderNumber}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: statusColors[newStatus],
        confirmButtonText: 'Continue',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
    } catch (error) {
      console.error('Error updating order:', error);
      Swal.close();
      
      // Show error message
      await Swal.fire({
        title: 'Update Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">Failed to update order status</p>
            <p style="color: #6b7280; font-size: 0.9rem;">Please try again or contact support if the problem persists.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Try Again',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'company-order-status-pending', text: 'Pending Review', icon: '🕐' },
      confirmed: { class: 'company-order-status-confirmed', text: 'Confirmed', icon: '✓' },
      cancelled: { class: 'company-order-status-cancelled', text: 'Cancelled', icon: '✕' },
      completed: { class: 'company-order-status-completed', text: 'Completed', icon: '🎉' }
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { class: 'company-order-payment-pending', text: 'Payment Pending' },
      paid: { class: 'company-order-payment-paid', text: 'Payment Confirmed' },
      failed: { class: 'company-order-payment-failed', text: 'Payment Failed' },
      refunded: { class: 'company-order-payment-refunded', text: 'Refunded' }
    };
    return badges[status] || badges.pending;
  };

  const openImageModal = (imageSrc, title = 'Image') => {
    setSelectedImage(imageSrc);
    setImageModalTitle(title);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
    setImageModalTitle('Image');
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      credit_card: { class: 'company-order-payment-credit-card', text: 'Credit Card', icon: '💳' },
      bank_transfer: { class: 'company-order-payment-bank-transfer', text: 'Bank Transfer', icon: '🏦' }
    };
    return badges[method] || badges.credit_card;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['company']}>
        <Layout>
          <div className="company-order-details-container">
            <div className="company-order-details-loading">
              <div className="company-order-details-loading-spinner"></div>
              <p>Loading order details...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute allowedRoles={['company']}>
        <Layout>
          <div className="company-order-details-container">
            <div className="company-order-details-error">
              <div className="company-order-details-error-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2>Order Not Found</h2>
              <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link href="/company/orders" className="company-order-details-btn-primary">
                Back to Orders
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="company-order-details-container">
          {/* Header */}
          <div className="company-order-details-header">
            <div className="company-order-details-breadcrumb">
              <Link href="/company/orders" className="company-order-details-breadcrumb-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to Orders</span>
              </Link>
            </div>

            <div className="company-order-details-title-section">
              <div className="company-order-details-title-group">
                <h1 className="company-order-details-title">Order #{order.orderNumber}</h1>
                <div className="company-order-details-badges">
                  <div className={`company-order-details-status-badge ${statusBadge.class}`}>
                    <span className="status-icon">{statusBadge.icon}</span>
                    <span>{statusBadge.text}</span>
                  </div>
                  <div className={`company-order-details-payment-badge ${paymentBadge.class}`}>
                    {paymentBadge.text}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="company-order-details-actions">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      disabled={updating}
                      className="company-order-details-btn-confirm"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {updating ? 'Processing...' : 'Confirm Order'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={updating}
                      className="company-order-details-btn-cancel"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Order
                    </button>
                  </>
                )}
                
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updating}
                    className="company-order-details-btn-complete"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="company-order-details-content">
            {/* Main Information */}
            <div className="company-order-details-main">
              {/* Customer Information */}
              <div className="company-order-details-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3>Customer Information</h3>
                </div>
                <div className="company-order-details-card-content">
                  <div className="company-order-customer-header">
                    <div className="company-order-customer-avatar">
                      {order.customer?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="company-order-customer-info">
                      <h4 className="company-order-customer-name">{order.customer?.name}</h4>
                      <div className="company-order-customer-contact">
                        <a href={`mailto:${order.contactEmail || order.customer?.email}`} className="company-order-contact-link">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {order.contactEmail || order.customer?.email}
                        </a>
                        <a href={`tel:${order.contactPhone || order.customer?.phone}`} className="company-order-contact-link">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {order.contactPhone || order.customer?.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Information */}
              <div className="company-order-details-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3>Package Details</h3>
                </div>
                <div className="company-order-details-card-content">
                  <h4 className="company-order-package-title">{order.package?.title}</h4>
                  <p className="company-order-package-description">{order.package?.description}</p>
                  
                  <div className="company-order-package-info">
                    <div className="company-order-info-grid">
                      <div className="company-order-info-item">
                        <div className="company-order-info-label">Departure Date</div>
                        <div className="company-order-info-value">{formatDate(order.package?.departureDate)}</div>
                      </div>
                      <div className="company-order-info-item">
                        <div className="company-order-info-label">Return Date</div>
                        <div className="company-order-info-value">{formatDate(order.package?.returnDate)}</div>
                      </div>
                      <div className="company-order-info-item">
                        <div className="company-order-info-label">Duration</div>
                        <div className="company-order-info-value">{order.package?.duration} days</div>
                      </div>
                      <div className="company-order-info-item">
                        <div className="company-order-info-label">Hotel</div>
                        <div className="company-order-info-value">{order.package?.hotelName} ({order.package?.hotelRating}★)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traveler Information */}
              <div className="company-order-details-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3>Travelers ({order.numberOfAdults || 0} Adults{order.numberOfChildren > 0 ? `, ${order.numberOfChildren} Children` : ''})</h3>
                </div>
                <div className="company-order-details-card-content">
                  <div className="company-order-travelers-list">
                    {order.travelers && order.travelers.map((traveler, index) => {
                      // Find matching passport and visa data for this traveler
                      const passportData = order.passports?.find(p => p.passengerName === traveler.name);
                      const visaData = order.visas?.find(v => v.passengerName === traveler.name);
                      
                      return (
                        <div key={index} className="company-order-traveler-item">
                          <div className="company-order-traveler-number">#{index + 1}</div>
                          <div className="company-order-traveler-info">
                            <div className="company-order-traveler-header">
                              <div className="company-order-traveler-name">{traveler.name}</div>
                              <div className="company-order-traveler-type-badge">
                                {traveler.isChild ? 'Child' : 'Adult'}
                              </div>
                            </div>
                            <div className="company-order-traveler-details">
                              <span className="company-order-traveler-detail">
                                <strong>Passport:</strong> {traveler.passportNumber || passportData?.passportNumber || 'Not provided'}
                              </span>
                              <span className="company-order-traveler-detail">
                                <strong>Gender:</strong> {traveler.gender}
                              </span>
                              <span className="company-order-traveler-detail">
                                <strong>Date of Birth:</strong> {traveler.dateOfBirth || passportData?.dateOfBirth || 'Not provided'}
                              </span>
                            </div>
                            
                            {/* Document Status */}
                            <div className="company-order-traveler-documents">
                              <div className="company-order-document-status">
                                <div className="company-order-document-item">
                                  <div className="company-order-document-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="company-order-document-info">
                                    <span className="company-order-document-label">Passport Document</span>
                                    <div className={`company-order-document-status-badge ${passportData ? 'uploaded' : 'not-uploaded'}`}>
                                      {passportData ? (
                                        <>
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span>Uploaded</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span>Not Uploaded</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {passportData && (
                                    <button 
                                      className="company-order-document-view-btn"
                                      onClick={() => {
                                        if (passportData.imagePath) {
                                          openImageModal(passportData.imagePath, `${traveler.name} - Passport Document`);
                                        } else {
                                          alert('Image not available');
                                        }
                                      }}
                                    >
                                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </button>
                                  )}
                                </div>
                                
                                <div className="company-order-document-item">
                                  <div className="company-order-document-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="company-order-document-info">
                                    <span className="company-order-document-label">Visa Document</span>
                                    <div className={`company-order-document-status-badge ${visaData ? 'uploaded' : 'not-uploaded'}`}>
                                      {visaData ? (
                                        <>
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span>Uploaded</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span>Not Uploaded</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {visaData && (
                                    <button 
                                      className="company-order-document-view-btn"
                                      onClick={() => {
                                        if (visaData.imagePath) {
                                          openImageModal(visaData.imagePath, `${traveler.name} - Visa Document`);
                                        } else {
                                          alert('Image not available');
                                        }
                                      }}
                                    >
                                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Assistance Requests */}
                              {(traveler.needsPassportAssistance || traveler.needsVisaAssistance) && (
                                <div className="company-order-assistance-requests">
                                  <div className="company-order-assistance-title">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Assistance Requested</span>
                                  </div>
                                  <div className="company-order-assistance-list">
                                    {traveler.needsPassportAssistance && (
                                      <div className="company-order-assistance-item">
                                        <span>🛂 Passport assistance</span>
                                      </div>
                                    )}
                                    {traveler.needsVisaAssistance && (
                                      <div className="company-order-assistance-item">
                                        <span>📋 Visa assistance</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {order.specialRequests && (
                <div className="company-order-details-card">
                  <div className="company-order-details-card-header">
                    <div className="company-order-details-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <h3>Special Requests</h3>
                  </div>
                  <div className="company-order-details-card-content">
                    <p className="company-order-special-requests">{order.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="company-order-details-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3>Payment Information</h3>
                </div>
                <div className="company-order-details-card-content">
                  <div className="company-order-payment-info">
                    {/* Payment Method */}
                    <div className="company-order-payment-method-section">
                      <div className="company-order-payment-method-header">
                        <span className="company-order-payment-method-label">Payment Method</span>
                        <div className={`company-order-payment-method-badge ${getPaymentMethodBadge(order.paymentMethod).class}`}>
                          <span className="payment-method-icon">{getPaymentMethodBadge(order.paymentMethod).icon}</span>
                          <span>{getPaymentMethodBadge(order.paymentMethod).text}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transfer Receipt */}
                    {order.paymentMethod === 'bank_transfer' && order.paymentReceiptPath && (
                      <div className="company-order-receipt-section">
                        <div className="company-order-receipt-header">
                          <div className="company-order-receipt-title">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Payment Receipt</span>
                          </div>
                          <div className="company-order-receipt-filename">
                            {order.paymentReceiptOriginalName || 'payment-receipt.jpg'}
                          </div>
                        </div>
                        
                        <div className="company-order-receipt-viewer">
                          <div className="company-order-receipt-thumbnail">
                            <img
                              src={order.paymentReceiptPath}
                              alt="Payment Receipt"
                              className="company-order-receipt-image"
                              onClick={() => openImageModal(order.paymentReceiptPath, 'Payment Receipt')}
                            />
                            <div className="company-order-receipt-overlay">
                              <button
                                className="company-order-receipt-view-btn"
                                onClick={() => openImageModal(order.paymentReceiptPath, 'Payment Receipt')}
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Full Size
                              </button>
                              <a
                                href={order.paymentReceiptPath}
                                download={order.paymentReceiptOriginalName}
                                className="company-order-receipt-download-btn"
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Notes */}
                    {order.paymentNotes && (
                      <div className="company-order-payment-notes">
                        <div className="company-order-payment-notes-title">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Payment Notes
                        </div>
                        <p className="company-order-payment-notes-text">{order.paymentNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="company-order-details-sidebar">
              {/* Order Summary */}
              <div className="company-order-details-card company-order-summary-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3>Order Summary</h3>
                </div>
                <div className="company-order-details-card-content">
                  <div className="company-order-summary-item">
                    <span>Order Date</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="company-order-summary-item">
                    <span>Adults</span>
                    <span>{order.numberOfAdults || order.numberOfTravelers} × {formatCurrency(order.package?.price || 0)}</span>
                  </div>
                  {order.numberOfChildren > 0 && (
                    <div className="company-order-summary-item">
                      <span>Children</span>
                      <span>{order.numberOfChildren} × {formatCurrency(order.package?.childPrice || 0)}</span>
                    </div>
                  )}
                  <div className="company-order-summary-divider"></div>
                  <div className="company-order-summary-item total">
                    <span>Total Amount</span>
                    <span className="company-order-total-amount">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="company-order-details-card">
                <div className="company-order-details-card-header">
                  <div className="company-order-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3>Order Timeline</h3>
                </div>
                <div className="company-order-details-card-content">
                  <div className="company-order-timeline">
                    <div className={`company-order-timeline-item ${order.createdAt ? 'completed' : ''}`}>
                      <div className="company-order-timeline-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="company-order-timeline-content">
                        <div className="company-order-timeline-title">Order Placed</div>
                        <div className="company-order-timeline-date">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className={`company-order-timeline-item ${['confirmed', 'completed'].includes(order.status) ? 'completed' : order.status === 'cancelled' ? 'cancelled' : ''}`}>
                      <div className="company-order-timeline-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="company-order-timeline-content">
                        <div className="company-order-timeline-title">
                          {order.status === 'cancelled' ? 'Order Cancelled' : 'Order Confirmed'}
                        </div>
                        <div className="company-order-timeline-date">
                          {['confirmed', 'completed', 'cancelled'].includes(order.status) ? 'Completed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`company-order-timeline-item ${order.status === 'completed' ? 'completed' : ''}`}>
                      <div className="company-order-timeline-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="company-order-timeline-content">
                        <div className="company-order-timeline-title">Service Completed</div>
                        <div className="company-order-timeline-date">
                          {order.status === 'completed' ? 'Completed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Modal */}
          {imageModalOpen && selectedImage && (
            <div className="company-order-image-modal" onClick={closeImageModal}>
              <div className="company-order-image-modal-backdrop"></div>
              <div className="company-order-image-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="company-order-image-modal-header">
                  <h3 className="company-order-image-modal-title">{imageModalTitle}</h3>
                  <button
                    className="company-order-image-modal-close"
                    onClick={closeImageModal}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="company-order-image-modal-body">
                  <img
                    src={selectedImage}
                    alt={imageModalTitle}
                    className="company-order-image-modal-image"
                  />
                </div>
                <div className="company-order-image-modal-footer">
                  <a
                    href={selectedImage}
                    download={imageModalTitle === 'Payment Receipt' ? (order?.paymentReceiptOriginalName || 'payment-receipt.jpg') : `${imageModalTitle.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                    className="company-order-image-modal-download"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download {imageModalTitle === 'Payment Receipt' ? 'Receipt' : 'Document'}
                  </a>
                  <button
                    className="company-order-image-modal-close-btn"
                    onClick={closeImageModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}