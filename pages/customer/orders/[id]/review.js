import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import orderService from '@/services/orderService';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

export default function WriteReview() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [backPath, setBackPath] = useState(`/customer/orders/${id}`);
  
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    serviceRating: 0,
    accommodationRating: 0,
    transportRating: 0,
    valueRating: 0,
    photos: []
  });

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
    
    // Determine back path based on session storage and referrer
    if (typeof window !== 'undefined') {
      const storedBackPath = sessionStorage.getItem('reviewBackPath');
      
      if (storedBackPath) {
        setBackPath(storedBackPath);
        // Clear the stored path after using it
        sessionStorage.removeItem('reviewBackPath');
      } else {
        // Fallback to referrer detection
        const referrer = document.referrer;
        
        if (referrer && (referrer.endsWith('/customer/orders') || referrer.includes('/customer/orders?'))) {
          setBackPath('/customer/orders');
        } else {
          setBackPath(`/customer/orders/${id}`);
        }
      }
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(id);
      if (response.order.status === 'completed' && response.order.customerId === user?.id) {
        setOrder(response.order);
      } else {
        router.push('/customer/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only require overall rating, everything else is optional
    if (!formData.rating) {
      await Swal.fire({
        title: 'Overall Rating Required',
        text: 'Please provide at least an overall rating',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: id,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      soundManager.playLogin();
      await Swal.fire({
        title: 'Thank You!',
        html: 'Your review has been submitted successfully',
        icon: 'success',
        confirmButtonColor: '#059669',
        timer: 3000,
        timerProgressBar: true
      });

      router.push(backPath);
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to submit review',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (field, value) => {
    return (
      <div className="review-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(field, star)}
            className={`review-star ${star <= value ? 'filled' : ''}`}
          >
            <Icon icon="star" />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <Layout>
          <div className="review-loading">
            <Icon icon="spinner" spin />
            <p>Loading order details...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="review-container">
          {/* Compact Header */}
          <div className="review-header">
            <button
              onClick={() => router.push(backPath)}
              className="review-back-button"
            >
              <Icon icon={['fas', 'arrow-left']} />
              {backPath === '/customer/orders' ? 'Back to Orders' : 'Back to Order Details'}
            </button>
            <div className="review-header-content">
              <h1 className="review-title">Share Your Experience</h1>
              <p className="review-subtitle">
                Your feedback helps other travelers and companies improve their services
              </p>
            </div>
          </div>

          {/* Compact Order Info */}
          <div className="review-order-card">
            <div className="review-order-header">
              <h3 className="review-order-title">{order?.package?.title || order?.package?.name}</h3>
              <div className="review-order-company">
                <Icon icon={['fas', 'building']} />
                {order?.company?.companyName}
              </div>
            </div>
            <div className="review-order-details">
              <div className="review-detail-item">
                <Icon icon={['fas', 'calendar-check']} />
                <span>Departure: {order?.package?.departureDate ? new Date(order?.package?.departureDate).toLocaleDateString() : 'TBD'}</span>
              </div>
              <div className="review-detail-item">
                <Icon icon={['fas', 'users']} />
                <span>{order?.travelers?.length || order?.numberOfAdults + (order?.numberOfChildren || 0) || order?.numberOfTravelers || 1} Travelers</span>
              </div>
            </div>
          </div>

          {/* Compact Review Form */}
          <form onSubmit={handleSubmit} className="review-form">
            <div className="review-form-grid">
              {/* Overall Rating */}
              <div className="review-section">
                <h2 className="review-section-title">Overall Rating</h2>
                <div className="review-rating-container">
                  {renderStars('rating', formData.rating)}
                  <span className="review-rating-label">
                    {formData.rating === 0 && 'Please rate your experience'}
                    {formData.rating === 1 && 'Poor'}
                    {formData.rating === 2 && 'Fair'}
                    {formData.rating === 3 && 'Good'}
                    {formData.rating === 4 && 'Very Good'}
                    {formData.rating === 5 && 'Excellent'}
                  </span>
                </div>
              </div>

              {/* Category Ratings - Compact Grid */}
              <div className="review-section">
                <h2 className="review-section-title">Rate Different Aspects</h2>
                <div className="review-categories-grid">
                  <div className="review-category">
                    <div className="review-category-header">
                      <Icon icon={['fas', 'concierge-bell']} />
                      <span>Service Quality</span>
                    </div>
                    {renderStars('serviceRating', formData.serviceRating)}
                  </div>

                  <div className="review-category">
                    <div className="review-category-header">
                      <Icon icon={['fas', 'bed']} />
                      <span>Accommodation</span>
                    </div>
                    {renderStars('accommodationRating', formData.accommodationRating)}
                  </div>

                  <div className="review-category">
                    <div className="review-category-header">
                      <Icon icon={['fas', 'bus']} />
                      <span>Transportation</span>
                    </div>
                    {renderStars('transportRating', formData.transportRating)}
                  </div>

                  <div className="review-category">
                    <div className="review-category-header">
                      <Icon icon={['fas', 'dollar-sign']} />
                      <span>Value for Money</span>
                    </div>
                    {renderStars('valueRating', formData.valueRating)}
                  </div>
                </div>
              </div>
            </div>

            {/* Written Review - Compact */}
            <div className="review-section review-text-section">
              <h2 className="review-section-title">Your Review</h2>
              <div className="review-text-inputs">
                <div className="review-form-group">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Summarize your experience in a few words (optional)"
                    className="review-input"
                  />
                </div>

                <div className="review-form-group">
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Share details about your trip, what you liked, and what could be improved... (optional)"
                    className="review-textarea"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            {/* Compact Actions */}
            <div className="review-actions">
              <button
                type="button"
                onClick={() => router.push(backPath)}
                className="review-cancel-button"
              >
                <Icon icon={['fas', 'times']} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="review-submit-button"
              >
                {submitting ? (
                  <>
                    <Icon icon={['fas', 'spinner']} spin />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icon icon={['fas', 'paper-plane']} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}