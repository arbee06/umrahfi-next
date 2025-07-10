import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Icon from '@/components/FontAwesome';

export default function CompanyProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('packages');

  useEffect(() => {
    if (id) {
      fetchCompanyProfile();
      fetchCompanyReviews();
    }
  }, [id]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch(`/api/companies/${id}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?companyId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="company-profile-stars">
        {[...Array(fullStars)].map((_, i) => (
          <Icon key={`full-${i}`} icon="star" className="star-filled" />
        ))}
        {hasHalfStar && <Icon icon="star-half-alt" className="star-filled" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Icon key={`empty-${i}`} icon="star" className="star-empty" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <Layout>
          <div className="company-profile-loading">
            <Icon icon="spinner" spin />
            <p>Loading company profile...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <Layout>
          <div className="company-profile-error">
            <Icon icon="building" />
            <h2>Company Not Found</h2>
            <p>The company profile you're looking for doesn't exist.</p>
            <Link href="/packages">
              <button className="company-profile-back-btn">
                Browse Packages
              </button>
            </Link>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        <div className="company-profile-page">
          {/* Header Section */}
          <div className="company-profile-hero">
            <div className="company-profile-hero-content">
              <div className="company-profile-logo-section">
                <img
                  src={profile.company.profilePicture || '/images/default-company.png'}
                  alt={profile.company.companyName}
                  className="company-profile-logo"
                />
              </div>
              
              <div className="company-profile-info">
                <h1 className="company-profile-name">{profile.company.companyName}</h1>
                <div className="company-profile-meta">
                  <span className="company-profile-location">
                    <Icon icon="map-marker-alt" />
                    {profile.company.country}
                  </span>
                  <span className="company-profile-license">
                    <Icon icon="certificate" />
                    License: {profile.company.companyLicense}
                  </span>
                  <span className="company-profile-member-since">
                    <Icon icon="calendar-alt" />
                    Member since {new Date(profile.company.createdAt).getFullYear()}
                  </span>
                </div>
              </div>

              <div className="company-profile-stats">
                <div className="company-stat-card">
                  <div className="stat-value">{profile.statistics.totalPackages}</div>
                  <div className="stat-label">Active Packages</div>
                </div>
                <div className="company-stat-card">
                  <div className="stat-value">{profile.statistics.completedBookings}</div>
                  <div className="stat-label">Completed Trips</div>
                </div>
                <div className="company-stat-card">
                  <div className="stat-rating">
                    <div className="stat-value">{profile.statistics.averageRating}</div>
                    {renderStars(profile.statistics.averageRating)}
                  </div>
                  <div className="stat-label">{profile.statistics.totalReviews} Reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="company-profile-tabs">
            <button
              className={`company-tab ${selectedTab === 'packages' ? 'active' : ''}`}
              onClick={() => setSelectedTab('packages')}
            >
              <Icon icon="box" />
              Popular Packages
            </button>
            <button
              className={`company-tab ${selectedTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setSelectedTab('reviews')}
            >
              <Icon icon="star" />
              Customer Reviews
            </button>
            <button
              className={`company-tab ${selectedTab === 'about' ? 'active' : ''}`}
              onClick={() => setSelectedTab('about')}
            >
              <Icon icon="info-circle" />
              About Company
            </button>
          </div>

          {/* Tab Content */}
          <div className="company-profile-content">
            {/* Popular Packages Tab */}
            {selectedTab === 'packages' && (
              <div className="company-packages-section">
                <h2 className="section-title">Popular Packages</h2>
                <div className="company-packages-grid">
                  {profile.popularPackages.map((pkg) => (
                    <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                      <div className="company-package-card">
                        <div className="package-badge">{pkg.type}</div>
                        <h3 className="package-name">{pkg.name}</h3>
                        <div className="package-details">
                          <span>
                            <Icon icon="calendar" />
                            {pkg.duration} days
                          </span>
                          <span>
                            <Icon icon="plane" />
                            {new Date(pkg.departureDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="package-options">
                          {pkg.departureAirports?.length > 0 && (
                            <span className="option-pill">
                              <Icon icon="plane-departure" />
                              {pkg.departureAirports.length} departure options
                            </span>
                          )}
                          {(pkg.makkahHotels?.length > 0 || pkg.madinahHotels?.length > 0) && (
                            <span className="option-pill">
                              <Icon icon="bed" />
                              Multiple hotel options
                            </span>
                          )}
                        </div>
                        <div className="package-price">
                          <span className="price-label">Starting from</span>
                          <span className="price-value">${pkg.price}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/packages?company=${id}`}>
                  <button className="view-all-packages-btn">
                    View All Packages
                    <Icon icon="arrow-right" />
                  </button>
                </Link>
              </div>
            )}

            {/* Reviews Tab */}
            {selectedTab === 'reviews' && (
              <div className="company-reviews-section">
                <h2 className="section-title">Customer Reviews</h2>
                
                {/* Rating Summary */}
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <div className="overall-rating">
                      <div className="rating-number">{profile.statistics.averageRating}</div>
                      {renderStars(profile.statistics.averageRating)}
                      <div className="rating-count">Based on {profile.statistics.totalReviews} reviews</div>
                    </div>
                    
                    <div className="rating-breakdown">
                      <div className="rating-category">
                        <span className="category-label">Service</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ width: `${(profile.statistics.ratings.service / 5) * 100}%` }}
                          />
                        </div>
                        <span className="category-value">{profile.statistics.ratings.service}</span>
                      </div>
                      <div className="rating-category">
                        <span className="category-label">Accommodation</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ width: `${(profile.statistics.ratings.accommodation / 5) * 100}%` }}
                          />
                        </div>
                        <span className="category-value">{profile.statistics.ratings.accommodation}</span>
                      </div>
                      <div className="rating-category">
                        <span className="category-label">Transport</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ width: `${(profile.statistics.ratings.transport / 5) * 100}%` }}
                          />
                        </div>
                        <span className="category-value">{profile.statistics.ratings.transport}</span>
                      </div>
                      <div className="rating-category">
                        <span className="category-label">Value</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ width: `${(profile.statistics.ratings.value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="category-value">{profile.statistics.ratings.value}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rating-distribution">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="distribution-row">
                        <span className="star-label">{star} star</span>
                        <div className="distribution-bar">
                          <div 
                            className="distribution-fill"
                            style={{ 
                              width: profile.statistics.totalReviews > 0 
                                ? `${(profile.statistics.distribution[star] / profile.statistics.totalReviews) * 100}%` 
                                : '0%' 
                            }}
                          />
                        </div>
                        <span className="distribution-count">{profile.statistics.distribution[star]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="reviews-list">
                  {reviewsLoading ? (
                    <div className="reviews-loading">
                      <Icon icon="spinner" spin />
                      <p>Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <img
                              src={review.customer?.profilePicture || '/images/default-avatar.png'}
                              alt={review.customer?.name}
                              className="reviewer-avatar"
                            />
                            <div>
                              <h4 className="reviewer-name">{review.customer?.name}</h4>
                              <p className="review-date">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        
                        <h3 className="review-title">{review.title}</h3>
                        <p className="review-comment">{review.comment}</p>
                        
                        {review.response && (
                          <div className="company-response">
                            <div className="response-header">
                              <Icon icon="reply" />
                              <span>Response from {profile.company.companyName}</span>
                            </div>
                            <p className="response-text">{review.response}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <Icon icon="comment-slash" />
                      <p>No reviews yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Tab */}
            {selectedTab === 'about' && (
              <div className="company-about-section">
                <h2 className="section-title">About {profile.company.companyName}</h2>
                <div className="about-content">
                  <div className="about-card">
                    <h3>Company Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <Icon icon="building" />
                        <div>
                          <span className="info-label">Company Name</span>
                          <span className="info-value">{profile.company.companyName}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <Icon icon="certificate" />
                        <div>
                          <span className="info-label">License Number</span>
                          <span className="info-value">{profile.company.companyLicense}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <Icon icon="map-marker-alt" />
                        <div>
                          <span className="info-label">Location</span>
                          <span className="info-value">{profile.company.country}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <Icon icon="envelope" />
                        <div>
                          <span className="info-label">Contact Email</span>
                          <span className="info-value">{profile.company.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="about-card">
                    <h3>Our Experience</h3>
                    <p>
                      With {profile.statistics.completedBookings} successful trips completed and 
                      an average rating of {profile.statistics.averageRating} stars, we are committed 
                      to providing exceptional Umrah experiences.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}