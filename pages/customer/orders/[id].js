import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import orderService from '@/services/orderService';
import Swal from 'sweetalert2';
import Icon from '@/components/FontAwesome';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const viewPassportDetails = (passportData) => {
    Swal.fire({
      title: '<Icon icon={["fas", "passport"]} /> Passport Information',
      html: `
        <div style="text-align: left; margin: 1rem 0; max-height: 400px; overflow-y: auto;">
          <div style="display: grid; gap: 1rem; font-size: 0.95rem;">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; padding: 0.75rem; background: #f3f4f6; border-radius: 0.5rem;">
              <strong>Full Name:</strong>
              <span>${passportData.givenNames || ''} ${passportData.surname || ''}</span>
            </div>
            ${passportData.passportType ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Passport Type:</strong>
              <span>${passportData.passportType}</span>
            </div>` : ''}
            ${passportData.passportNumber ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Passport Number:</strong>
              <span style="font-family: monospace;">${passportData.passportNumber}</span>
            </div>` : ''}
            ${passportData.nationality ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Nationality:</strong>
              <span>${passportData.nationality}</span>
            </div>` : ''}
            ${passportData.dateOfBirth ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Date of Birth:</strong>
              <span>${new Date(passportData.dateOfBirth).toLocaleDateString()}</span>
            </div>` : ''}
            ${passportData.placeOfBirth ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Place of Birth:</strong>
              <span>${passportData.placeOfBirth}</span>
            </div>` : ''}
            ${passportData.sex ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Gender:</strong>
              <span>${passportData.sex === 'M' ? 'Male' : 'Female'}</span>
            </div>` : ''}
            ${passportData.dateOfIssue ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Issue Date:</strong>
              <span>${new Date(passportData.dateOfIssue).toLocaleDateString()}</span>
            </div>` : ''}
            ${passportData.dateOfExpiry ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; padding: 0.75rem; background: ${new Date(passportData.dateOfExpiry) < new Date() ? '#fef2f2' : '#f0fdf4'}; border-radius: 0.5rem;">
              <strong>Expiry Date:</strong>
              <span style="color: ${new Date(passportData.dateOfExpiry) < new Date() ? '#dc2626' : '#059669'}; font-weight: 600;">
                ${new Date(passportData.dateOfExpiry).toLocaleDateString()}
                ${new Date(passportData.dateOfExpiry) < new Date() ? ' (EXPIRED)' : ''}
              </span>
            </div>` : ''}
            ${passportData.issuingAuthority ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Issuing Authority:</strong>
              <span>${passportData.issuingAuthority}</span>
            </div>` : ''}
            ${passportData.countryCode ? `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Country Code:</strong>
              <span>${passportData.countryCode}</span>
            </div>` : ''}
          </div>
          ${passportData.mrzLine1 || passportData.mrzLine2 ? `
          <div style="margin-top: 1.5rem; padding: 1rem; background: #1e293b; border-radius: 0.5rem;">
            <h4 style="color: #60a5fa; margin: 0 0 0.5rem 0; font-size: 0.9rem;">Machine Readable Zone (MRZ)</h4>
            <div style="font-family: monospace; color: #f1f5f9; font-size: 0.85rem; line-height: 1.5;">
              ${passportData.mrzLine1 ? `<div>${passportData.mrzLine1}</div>` : ''}
              ${passportData.mrzLine2 ? `<div>${passportData.mrzLine2}</div>` : ''}
            </div>
          </div>` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonColor: '#059669',
      confirmButtonText: 'Close',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html',
        confirmButton: 'custom-swal-confirm'
      },
      buttonsStyling: false
    });
  };

  const handleCancelBooking = async () => {
    if (!order) return;
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Cancel Booking?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">You're about to cancel:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${order.package?.title}</p>
          <p style="color: #6b7280; margin-bottom: 0.5rem;">Order: ${order.orderNumber}</p>
          <p style="color: #6b7280; margin-bottom: 1rem;">Total Amount: ${formatCurrency(order.totalAmount)}</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #ef4444; font-weight: 600; margin: 0 0 0.5rem 0;">⚠ Important Notice:</p>
            <p style="color: #dc2626; margin: 0.25rem 0; font-size: 0.9rem;">• Cancellation may incur fees as per our policy</p>
            <p style="color: #dc2626; margin: 0.25rem 0; font-size: 0.9rem;">• Refund processing may take 5-10 business days</p>
            <p style="color: #dc2626; margin: 0.25rem 0; font-size: 0.9rem;">• This action cannot be undone</p>
          </div>
          <p style="color: #6b7280; font-size: 0.9rem;">Please contact the travel partner if you have any questions about the cancellation policy.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel Booking',
      cancelButtonText: 'Keep Booking',
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
    
    // Show loading state
    Swal.fire({
      title: 'Cancelling Booking...',
      html: 'Please wait while we process your cancellation.',
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
      await orderService.updateOrder(order.id, { status: 'cancelled' });
      setOrder({ ...order, status: 'cancelled' });
      
      // Show success message
      await Swal.fire({
        title: 'Booking Cancelled',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 1rem;">Your booking has been successfully cancelled</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Order Number:</p>
            <p style="font-weight: 600; color: #1f2937; font-family: monospace;">${order.orderNumber}</p>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
              <p style="color: #0284c7; margin: 0; font-size: 0.9rem;">A confirmation email will be sent to you shortly with refund details.</p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'View My Orders',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/customer/orders');
        }
      });
    } catch (error) {
      Swal.close();
      console.error('Error cancelling order:', error);
      
      // Show error message
      await Swal.fire({
        title: 'Cancellation Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">Failed to cancel your booking</p>
            <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">${error.error || 'Please try again or contact customer support.'}</p>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
              <p style="color: #0284c7; margin: 0; font-size: 0.9rem;">You can also contact your travel partner directly for assistance.</p>
            </div>
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
      draft: { class: 'status-draft', text: 'Payment Required', icon: 'credit-card' },
      pending: { class: 'status-pending', text: 'Pending', icon: 'clock' },
      confirmed: { class: 'status-confirmed', text: 'Confirmed', icon: 'check' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled', icon: 'times' },
      completed: { class: 'status-completed', text: 'Completed', icon: 'check-circle' }
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { class: 'payment-pending', text: 'Payment Pending' },
      completed: { class: 'payment-completed', text: 'Payment Completed' },
      partial: { class: 'payment-partial', text: 'Partial Payment' },
      refunded: { class: 'payment-refunded', text: 'Refunded' }
    };
    return badges[status] || badges.pending;
  };

  const handleCompletePayment = () => {
    // Redirect to booking page with order details to complete payment
    router.push(`/customer/book/${order.packageId}?completeOrder=${order.id}`);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <Layout>
          <div className="order-details-container">
            <div className="order-details-loading">
              <div className="order-details-loading-spinner"></div>
              <p>Loading order details...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <Layout>
          <div className="order-details-container">
            <div className="order-details-error">
              <div className="order-details-error-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2>Order Not Found</h2>
              <p>The order you're looking for doesn't exist or has been removed.</p>
              <Link href="/customer/orders" className="order-details-btn-primary">
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
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="order-details-container">
          {/* Header */}
          <div className="order-details-header">
            <div className="order-details-breadcrumb">
              <Link href="/customer/orders" className="order-details-breadcrumb-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to Orders</span>
              </Link>
            </div>

            <div className="order-details-title-section">
              <h1 className="order-details-title">Order #{order.orderNumber}</h1>
              <div className="order-details-badges">
                <div className={`order-details-status-badge ${statusBadge.class}`}>
                  <Icon icon={['fas', statusBadge.icon]} className="status-icon" />
                  <span>{statusBadge.text}</span>
                </div>
                {/* <div className={`order-details-payment-badge ${paymentBadge.class}`}>
                  {paymentBadge.text}
                </div> */}
              </div>
            </div>
          </div>

          <div className="order-details-content">
            {/* Main Information */}
            <div className="order-details-main">
              {/* Package Information */}
              <div className="order-details-card">
                <div className="order-details-card-header">
                  <h3>Package Details</h3>
                </div>
                <div className="order-details-card-content">
                  <h4 className="package-title">{order.package?.title}</h4>
                  <p className="package-description">{order.package?.description}</p>
                  
                  <div className="package-info-grid">
                    <div className="info-item">
                      <div className="info-label">Departure Date</div>
                      <div className="info-value">{formatDate(order.package?.departureDate)}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Return Date</div>
                      <div className="info-value">{formatDate(order.package?.returnDate)}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Duration</div>
                      <div className="info-value">{order.package?.duration} days</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Hotel</div>
                      <div className="info-value">{order.package?.hotelName} ({order.package?.hotelRating}★)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traveler Information */}
              <div className="order-details-card">
                <div className="order-details-card-header">
                  <h3>Traveler Information ({order.numberOfAdults || 0} Adults{order.numberOfChildren > 0 ? `, ${order.numberOfChildren} Children` : ''})</h3>
                </div>
                <div className="order-details-card-content">
                  <div className="travelers-list">
                    {order.travelers && order.travelers.map((traveler, index) => {
                      const passportData = order.passports?.find(p => p.passengerName === traveler.name);
                      return (
                        <div key={index} className="traveler-item">
                          <div className="traveler-header">
                            <div className="traveler-number">Traveler {index + 1}</div>
                            {passportData && (
                              <button 
                                className="passport-view-btn"
                                onClick={() => viewPassportDetails(passportData)}
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                View Passport
                              </button>
                            )}
                          </div>
                          <div className="traveler-info">
                            <div className="traveler-name">{traveler.name}</div>
                            <div className="traveler-details">
                              <span>Passport: {traveler.passportNumber}</span>
                              <span className="separator">•</span>
                              <span>Gender: {traveler.gender}</span>
                              <span className="separator">•</span>
                              <span>DOB: {traveler.dateOfBirth ? new Date(traveler.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                              <span className="separator">•</span>
                              <span>Type: {traveler.isChild ? 'Child' : 'Adult'}</span>
                            </div>
                            {passportData && (
                              <div className="passport-status">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Passport data available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="order-details-card">
                <div className="order-details-card-header">
                  <h3>Payment Information</h3>
                </div>
                <div className="order-details-card-content">
                  <div className="payment-info-grid">
                    <div className="info-item">
                      <div className="info-label">Payment Method</div>
                      <div className="info-value payment-method">
                        {order.paymentMethod === 'stripe' && (
                          <span><Icon icon={['fas', 'credit-card']} /> Stripe</span>
                        )}
                        {order.paymentMethod === 'bank_transfer' && (
                          <span><Icon icon={['fas', 'university']} /> Bank Transfer</span>
                        )}
                        {order.paymentMethod === 'cash' && (
                          <span><Icon icon={['fas', 'money-bill-wave']} /> Cash Payment</span>
                        )}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Payment Status</div>
                      <div className={`info-value payment-status ${order.paymentStatus}`}>
                        {order.paymentStatus === 'pending' && (
                          <span><Icon icon={['fas', 'clock']} /> Pending</span>
                        )}
                        {order.paymentStatus === 'completed' && (
                          <span><Icon icon={['fas', 'check-circle']} /> Completed</span>
                        )}
                        {order.paymentStatus === 'partial' && (
                          <span><Icon icon={['fas', 'hourglass-half']} /> Partial</span>
                        )}
                        {order.paymentStatus === 'refunded' && (
                          <span><Icon icon={['fas', 'undo']} /> Refunded</span>
                        )}
                      </div>
                    </div>
                    {order.stripePaymentIntentId && (
                      <div className="info-item">
                        <div className="info-label">Stripe Payment ID</div>
                        <div className="info-value stripe-payment-id">{order.stripePaymentIntentId}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {order.specialRequests && (
                <div className="order-details-card">
                  <div className="order-details-card-header">
                    <h3>Special Requests</h3>
                  </div>
                  <div className="order-details-card-content">
                    <p className="special-requests">{order.specialRequests}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="order-details-sidebar">
              {/* Order Summary */}
              <div className="order-details-card summary-card">
                <div className="order-details-card-header">
                  <h3>Order Summary</h3>
                </div>
                <div className="order-details-card-content">
                  <div className="summary-item">
                    <span>Order Date</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Adults</span>
                    <span>{order.numberOfAdults || order.numberOfTravelers} × {formatCurrency(order.package?.price || 0)}</span>
                  </div>
                  {order.numberOfChildren > 0 && (
                    <div className="summary-item">
                      <span>Children</span>
                      <span>{order.numberOfChildren} × {formatCurrency(order.package?.childPrice || 0)}</span>
                    </div>
                  )}
                  <div className="summary-divider"></div>
                  <div className="summary-item total">
                    <span>Total Amount</span>
                    <span className="total-amount">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="order-details-card">
                <div className="order-details-card-header">
                  <h3>Contact Information</h3>
                </div>
                <div className="order-details-card-content">
                  <div className="contact-info">
                    <div className="contact-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="contact-label">Email</div>
                        <div className="contact-value">{order.contactEmail}</div>
                      </div>
                    </div>
                    <div className="contact-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="contact-label">Phone</div>
                        <div className="contact-value">{order.contactPhone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="order-details-card">
                <div className="order-details-card-header">
                  <h3>Travel Partner</h3>
                </div>
                <div className="order-details-card-content">
                  <div className="company-info">
                    <h4>{order.company?.companyName}</h4>
                    <div className="company-contact">
                      <a href={`mailto:${order.company?.email}`}>{order.company?.email}</a>
                      <a href={`tel:${order.company?.phone}`}>{order.company?.phone}</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {order.status === 'draft' && (
                <div className="order-details-actions">
                  <button 
                    className="order-details-btn-primary"
                    onClick={handleCompletePayment}
                  >
                    <Icon icon={['fas', 'credit-card']} />
                    Complete Payment
                  </button>
                  <button 
                    className="order-details-btn-cancel"
                    onClick={handleCancelBooking}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
              {order.status === 'pending' && (
                <div className="order-details-actions">
                  <button 
                    className="order-details-btn-cancel"
                    onClick={handleCancelBooking}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}