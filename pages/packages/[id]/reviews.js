import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Icon from '@/components/FontAwesome';

export default function PackageReviews() {
  const router = useRouter();
  const { id } = router.query;
  const [packageData, setPackageData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    
    if (id) {
      fetchPackageAndReviews(id);
    }
  }, [router.isReady, id]);

  const fetchPackageAndReviews = async (packageId) => {
    try {
      // Fetch package info
      const packageResponse = await fetch(`/api/packages/${packageId}`);
      if (packageResponse.ok) {
        const packageData = await packageResponse.json();
        setPackageData(packageData.package);
      }

      // Fetch reviews
      const reviewsResponse = await fetch(`/api/reviews?packageId=${packageId}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setReviewsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="package-review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon 
            key={star} 
            icon="star" 
            className={star <= rating ? 'star-filled' : 'star-empty'} 
          />
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <Layout>
        <div className="pkg-reviews-loading">
          <Icon icon="spinner" spin />
          <span>Loading reviews...</span>
        </div>
      </Layout>
    );
  }

  if (!packageData) {
    return (
      <Layout>
        <div className="pkg-reviews-error">
          <Icon icon="exclamation-triangle" />
          <h2>Package Not Found</h2>
          <p>The package you're looking for doesn't exist.</p>
          <Link href="/packages" className="pkg-reviews-btn">
            Browse Packages
          </Link>
        </div>
      </Layout>
    );
  }

  const ratingDistribution = getRatingDistribution();
  const averageRating = calculateAverageRating();

  return (
    <Layout>
      <div className="pkg-reviews-container">
        {/* Header */}
        <div className="pkg-reviews-header">
          <div className="pkg-reviews-breadcrumb">
            <Link href="/packages" className="pkg-reviews-breadcrumb-link">
              <Icon icon={['fas', 'arrow-left']} />
              <span>All Packages</span>
            </Link>
            <span className="pkg-reviews-breadcrumb-separator">/</span>
            <Link href={`/packages/${id}`} className="pkg-reviews-breadcrumb-link">
              <span>{packageData.title}</span>
            </Link>
            <span className="pkg-reviews-breadcrumb-separator">/</span>
            <span className="pkg-reviews-breadcrumb-current">Reviews</span>
          </div>

          <div className="pkg-reviews-title-section">
            <h1 className="pkg-reviews-title">Customer Reviews</h1>
            <p className="pkg-reviews-subtitle">
              See what other travelers are saying about {packageData.title}
            </p>
          </div>
        </div>

        <div className="pkg-reviews-content">
          {/* Reviews Summary */}
          <div className="pkg-reviews-summary-card">
            <div className="pkg-reviews-summary-main">
              <div className="pkg-reviews-summary-rating">
                <div className="pkg-reviews-summary-score">{averageRating}</div>
                <div className="pkg-reviews-summary-stars">
                  {renderStars(Math.round(averageRating))}
                </div>
                <div className="pkg-reviews-summary-count">
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>

            <div className="pkg-reviews-summary-distribution">
              <h4>Rating Distribution</h4>
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="pkg-reviews-distribution-item">
                  <span className="pkg-reviews-distribution-rating">{rating} star</span>
                  <div className="pkg-reviews-distribution-bar">
                    <div 
                      className="pkg-reviews-distribution-fill"
                      style={{ 
                        width: reviews.length > 0 ? `${(ratingDistribution[rating] / reviews.length) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  <span className="pkg-reviews-distribution-count">{ratingDistribution[rating]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="pkg-reviews-list">
            {reviewsLoading ? (
              <div className="pkg-reviews-loading">
                <Icon icon="spinner" spin />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="pkg-reviews-empty">
                <Icon icon="comment-alt" />
                <h3>No reviews yet</h3>
                <p>Be the first to book this package and share your experience!</p>
                <Link href={`/packages/${id}`} className="pkg-reviews-btn">
                  View Package Details
                </Link>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="pkg-reviews-item">
                  <div className="pkg-reviews-item-header">
                    <div className="pkg-reviews-user">
                      <div className="pkg-reviews-avatar">
                        {review.customer?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="pkg-reviews-user-info">
                        <div className="pkg-reviews-name">{review.customer?.name || 'Anonymous'}</div>
                        <div className="pkg-reviews-date">{formatDate(review.createdAt)}</div>
                      </div>
                    </div>
                    <div className="pkg-reviews-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  {review.title && (
                    <h4 className="pkg-reviews-item-title">{review.title}</h4>
                  )}
                  
                  {review.comment && (
                    <p className="pkg-reviews-item-comment">{review.comment}</p>
                  )}
                  
                  <div className="pkg-reviews-categories">
                    <div className="pkg-reviews-category">
                      <span>Service</span>
                      {renderStars(review.serviceRating)}
                    </div>
                    <div className="pkg-reviews-category">
                      <span>Accommodation</span>
                      {renderStars(review.accommodationRating)}
                    </div>
                    <div className="pkg-reviews-category">
                      <span>Transportation</span>
                      {renderStars(review.transportRating)}
                    </div>
                    <div className="pkg-reviews-category">
                      <span>Value</span>
                      {renderStars(review.valueRating)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}