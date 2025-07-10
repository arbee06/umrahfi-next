import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/utils/AuthContext';
import { getAirportByCode } from '@/utils/airports';
import packageService from '@/services/packageService';
import Icon from '@/components/FontAwesome';

export default function PackageDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  const handleBackClick = () => {
    // If there's a previous page in history, go back
    if (window.history.length > 1) {
      router.back();
    } else {
      // Otherwise, route based on user role
      if (user?.role === 'company') {
        router.push('/company/packages');
      } else if (user?.role === 'admin') {
        router.push('/admin/packages');
      } else {
        router.push('/packages');
      }
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    
    if (id) {
      fetchPackage(id);
    } else {
      setLoading(false);
    }
  }, [router.isReady, id]);

  const fetchPackage = async (packageId) => {
    try {
      const response = await packageService.getPackageById(packageId);
      setPackageData(response.package);
      
      // Fetch reviews for this package
      fetchReviews(packageId);
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (packageId) => {
    try {
      const response = await fetch(`/api/reviews?packageId=${packageId}`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
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

  const openImageModal = (image) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageModalOpen(false);
  };

  const nextImage = () => {
    if (!packageData.images || packageData.images.length === 0) return;
    const currentIndex = packageData.images.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % packageData.images.length;
    setSelectedImage(packageData.images[nextIndex]);
  };

  const prevImage = () => {
    if (!packageData.images || packageData.images.length === 0) return;
    const currentIndex = packageData.images.indexOf(selectedImage);
    const prevIndex = currentIndex === 0 ? packageData.images.length - 1 : currentIndex - 1;
    setSelectedImage(packageData.images[prevIndex]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="package-details-container">
          <div className="package-details-background">
            <div className="package-details-pattern"></div>
            <div className="package-details-gradient"></div>
          </div>
          <div className="package-details-content">
            <div className="package-details-loading">
              <div className="package-details-loading-spinner"></div>
              <p>Loading package details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!packageData) {
    return (
      <Layout>
        <div className="package-details-container">
          <div className="package-details-background">
            <div className="package-details-pattern"></div>
            <div className="package-details-gradient"></div>
          </div>
          <div className="package-details-content">
            <div className="package-details-error-card">
              <div className="package-details-error-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2>Package Not Found</h2>
              <p>The requested package could not be found. It may have been removed or is no longer available.</p>
              <button onClick={handleBackClick} className="package-details-btn-primary">
                <span>Browse All Packages</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="package-details-container">
        <div className="package-details-background">
          <div className="package-details-pattern"></div>
          <div className="package-details-gradient"></div>
        </div>
        
        <div className="package-details-content">
          {/* Header Section */}
          <div className="package-details-header">
            <div className="package-details-breadcrumb">
              <button onClick={handleBackClick} className="package-details-breadcrumb-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to Packages</span>
              </button>
            </div>
            
            <div className="package-details-title-section">
              <div className="package-details-badge">
                {packageData.availableSeats > 0 ? (
                  <span className="package-details-status-available">Available</span>
                ) : (
                  <span className="package-details-status-sold">Sold Out</span>
                )}
              </div>
              <h1 className="package-details-title">{packageData.title}</h1>
              <p className="package-details-description">{packageData.description}</p>
            </div>
          </div>


          {/* Main Content Grid */}
          <div className="package-details-grid">
            {/* Left Column - Package Information */}
            <div className="package-details-main">
              {/* Trip Information Card */}
              <div className="package-details-card">
                <div className="package-details-card-header">
                  <div className="package-details-card-icon">
                    <Icon icon="calendar" />
                  </div>
                  <h3>Trip Information</h3>
                </div>

                <div className="package-details-info-grid">
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Price per person</div>
                    <div className="package-details-info-value package-details-price">{formatPrice(packageData.price)}</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Duration</div>
                    <div className="package-details-info-value">{packageData.duration} days</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Departure Date</div>
                    <div className="package-details-info-value">{formatDate(packageData.departureDate)}</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Return Date</div>
                    <div className="package-details-info-value">{formatDate(packageData.returnDate)}</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Available Seats</div>
                    <div className="package-details-info-value">
                      <span className="package-details-seats">{packageData.availableSeats}</span> of {packageData.totalSeats}
                    </div>
                  </div>
                </div>

                {/* Modern Image Gallery at bottom of Trip Information */}
                {packageData.images && packageData.images.length > 0 && (
                  <div className="package-gallery-modern">
                    <div className="package-gallery-header">
                      <h4 className="package-gallery-subtitle">
                        <Icon icon={['fas', 'camera']} />
                        Package Gallery ({packageData.images.length} photos)
                      </h4>
                    </div>
                    
                    {packageData.images.length === 1 ? (
                      /* Single Image Display */
                      <div className="package-gallery-single">
                        <img
                          src={packageData.images[0]}
                          alt={`${packageData.title} - Package photo`}
                          className="package-gallery-single-image"
                          onClick={() => openImageModal(packageData.images[0])}
                        />
                        <div className="package-gallery-single-overlay">
                          <button 
                            className="package-gallery-expand-btn"
                            onClick={() => openImageModal(packageData.images[0])}
                          >
                            <Icon icon="expand-arrows-alt" />
                            <span>View Full Size</span>
                          </button>
                        </div>
                      </div>
                    ) : packageData.images.length <= 4 ? (
                      /* Grid Layout for 2-4 images */
                      <div className={`package-gallery-grid package-gallery-grid-${packageData.images.length}`}>
                        {packageData.images.map((image, index) => (
                          <div 
                            key={index} 
                            className="package-gallery-grid-item"
                            onClick={() => openImageModal(image)}
                          >
                            <img
                              src={image}
                              alt={`${packageData.title} - Photo ${index + 1}`}
                              className="package-gallery-grid-image"
                            />
                            <div className="package-gallery-grid-overlay">
                              <Icon icon="search-plus" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Featured + Thumbnails for 5+ images */
                      <div className="package-gallery-container">
                        <div className="package-gallery-featured">
                          <img
                            src={packageData.images[0]}
                            alt={`${packageData.title} - Main photo`}
                            className="package-gallery-featured-image"
                            onClick={() => openImageModal(packageData.images[0])}
                          />
                          <div className="package-gallery-featured-overlay">
                            <button 
                              className="package-gallery-expand-btn"
                              onClick={() => openImageModal(packageData.images[0])}
                            >
                              <Icon icon="expand-arrows-alt" />
                              <span>View Gallery</span>
                            </button>
                          </div>
                          <div className="package-gallery-badge">
                            <Icon icon="images" />
                            <span>{packageData.images.length}</span>
                          </div>
                        </div>

                        <div className="package-gallery-thumbnails">
                          {packageData.images.slice(1, 5).map((image, index) => (
                            <div 
                              key={index + 1} 
                              className="package-gallery-thumbnail"
                              onClick={() => openImageModal(image)}
                            >
                              <img
                                src={image}
                                alt={`${packageData.title} - Photo ${index + 2}`}
                                className="package-gallery-thumbnail-image"
                              />
                              <div className="package-gallery-thumbnail-overlay">
                                <Icon icon="search-plus" />
                              </div>
                            </div>
                          ))}
                          
                          {packageData.images.length > 5 && (
                            <div 
                              className="package-gallery-thumbnail package-gallery-more-btn"
                              onClick={() => openImageModal(packageData.images[5])}
                            >
                              <img
                                src={packageData.images[5]}
                                alt="More photos"
                                className="package-gallery-thumbnail-image"
                              />
                              <div className="package-gallery-more-overlay">
                                <Icon icon="plus" />
                                <span>+{packageData.images.length - 5}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accommodation Card */}
              <div className="package-details-card">
                <div className="package-details-card-header">
                  <div className="package-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3>Accommodation & Services</h3>
                </div>
                <div className="package-details-info-grid">
                  {(packageData.makkahHotels?.length > 0 || packageData.madinahHotels?.length > 0) && (
                    <div className="package-details-info-item package-details-hotels-section">
                      <div className="package-details-info-label">Accommodation Options</div>
                      <div className="package-details-info-value">
                        <div className="package-details-hotels-grid">
                          {packageData.makkahHotels?.length > 0 && (
                            <div className="package-details-hotel-group">
                              <div className="package-details-hotel-group-content">
                                <h4 className="package-details-hotel-city">
                                  <span className="package-details-city-header">Makkah Hotels</span>
                                  <span className="package-details-city-days">{packageData.makkahDays || 7} days</span>
                                </h4>
                                <div className="package-details-hotel-list">
                                  {packageData.makkahHotels.map((hotel, index) => (
                                    <div key={index} className="package-details-hotel-item">
                                      <div className="package-details-hotel-name">{hotel.name}</div>
                                      <div className="package-details-hotel-rating">
                                        {[...Array(parseInt(hotel.rating))].map((_, i) => (
                                          <Icon key={i} icon={['fas', 'star']} className="package-details-star-filled" />
                                        ))}
                                        <span className="package-details-rating-text">({hotel.rating}★)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {packageData.madinahHotels?.length > 0 && (
                            <div className="package-details-hotel-group">
                              <div className="package-details-hotel-group-content">
                                <h4 className="package-details-hotel-city">
                                  <span className="package-details-city-header">Madinah Hotels</span>
                                  <span className="package-details-city-days">{packageData.madinaDays || 3} days</span>
                                </h4>
                                <div className="package-details-hotel-list">
                                  {packageData.madinahHotels.map((hotel, index) => (
                                    <div key={index} className="package-details-hotel-item">
                                      <div className="package-details-hotel-name">{hotel.name}</div>
                                      <div className="package-details-hotel-rating">
                                        {[...Array(parseInt(hotel.rating))].map((_, i) => (
                                          <Icon key={i} icon={['fas', 'star']} className="package-details-star-filled" />
                                        ))}
                                        <span className="package-details-rating-text">({hotel.rating}★)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="package-details-services-card">
                    <div className="package-details-services-compact">
                      {/* Flight Options Section */}
                      {(packageData.departureAirports?.length > 0 || packageData.arrivalAirports?.length > 0) && (
                        <div className="package-details-flights-section">
                          <div className="package-details-service-label">Flight Options</div>
                          <div className="package-details-flights-grid">
                            {packageData.departureAirports?.length > 0 && (
                              <div className="package-details-flight-item">
                                <span className="package-details-flight-label">Departure:</span>
                                <div className="package-details-airport-list">
                                  {packageData.departureAirports.map((airport, index) => (
                                    <span key={index} className="package-details-airport-tag">
                                      {airport && getAirportByCode(airport) 
                                        ? `${airport} (${getAirportByCode(airport).city})` 
                                        : airport
                                      }
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {packageData.arrivalAirports?.length > 0 && (
                              <div className="package-details-flight-item">
                                <span className="package-details-flight-label">Arrival:</span>
                                <div className="package-details-airport-list">
                                  {packageData.arrivalAirports.map((airport, index) => (
                                    <span key={index} className="package-details-airport-tag">
                                      {airport && getAirportByCode(airport) 
                                        ? `${airport} (${getAirportByCode(airport).city})` 
                                        : airport
                                      }
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Transportation and Meal Plan */}
                      <div className="package-details-other-services">
                        <div className="package-details-service-compact">
                          <span className="package-details-service-label">Transportation</span>
                          <span className="package-details-service-value">{packageData.transportation}</span>
                        </div>
                        <div className="package-details-service-compact">
                          <span className="package-details-service-label">Meal Plan</span>
                          <span className="package-details-service-value">{packageData.mealPlan}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary Card */}
              {packageData.itinerary && packageData.itinerary.length > 0 && (
                <div className="package-details-card">
                  <div className="package-details-card-header">
                    <div className="package-details-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3>Daily Itinerary</h3>
                  </div>
                  <div className="package-details-itinerary">
                    {packageData.itinerary.map((item, index) => (
                      <div key={index} className="package-details-itinerary-item">
                        <div className="package-details-day-number">Day {item.day}</div>
                        <div className="package-details-day-description">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="package-details-inclusions-grid">
                {packageData.inclusions && packageData.inclusions.length > 0 && (
                  <div className="package-details-card">
                    <div className="package-details-card-header">
                      <div className="package-details-card-icon package-details-icon-success">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3>What's Included</h3>
                    </div>
                    <div className="package-details-list">
                      {packageData.inclusions.map((item, index) => (
                        <div key={index} className="package-details-list-item package-details-included">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {packageData.exclusions && packageData.exclusions.length > 0 && (
                  <div className="package-details-card">
                    <div className="package-details-card-header">
                      <div className="package-details-card-icon package-details-icon-warning">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3>Not Included</h3>
                    </div>
                    <div className="package-details-list">
                      {packageData.exclusions.map((item, index) => (
                        <div key={index} className="package-details-list-item package-details-excluded">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column - Booking & Company Info */}
            <div className="package-details-sidebar">
              {/* Booking Card */}
              <div className="package-details-booking-card">
                <div className="package-details-booking-header">
                  <div className="package-details-booking-price">
                    <div className="package-details-price-group">
                      <span className="package-details-price-amount">{formatPrice(packageData.price)}</span>
                      <span className="package-details-price-label">per adult</span>
                    </div>
                    {packageData.childPrice > 0 && (
                      <div className="package-details-price-group package-details-price-child">
                        <span className="package-details-price-amount">{formatPrice(packageData.childPrice)}</span>
                        <span className="package-details-price-label">per child</span>
                      </div>
                    )}
                  </div>
                  <div className="package-details-booking-availability">
                    {packageData.availableSeats > 0 ? (
                      <span className="package-details-seats-available">
                        {packageData.availableSeats} seats available
                      </span>
                    ) : (
                      <span className="package-details-seats-sold">Sold out</span>
                    )}
                  </div>
                </div>

                <div className="package-details-booking-actions">
                  {packageData.availableSeats > 0 ? (
                    isAuthenticated && user?.role === 'customer' ? (
                      <Link href={`/customer/book/${packageData.id}`} className="package-details-btn-primary">
                        <span>Book Now</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    ) : !isAuthenticated ? (
                      <Link href="/login" className="package-details-btn-primary">
                        <span>Login to Book</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </Link>
                    ) : user?.role === 'admin' ? (
                      <div className="package-details-booking-note">
                        <p>Admin accounts are for management purposes only.</p>
                      </div>
                    ) : (
                      <div className="package-details-booking-note">
                        <p>Company accounts cannot book packages directly.</p>
                      </div>
                    )
                  ) : (
                    <button className="package-details-btn-disabled" disabled>
                      <span>Sold Out</span>
                    </button>
                  )}
                </div>

                <div className="package-details-booking-features">
                  <div className="package-details-feature">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Instant confirmation</span>
                  </div>
                  <div className="package-details-feature">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Secure payment</span>
                  </div>
                  <div className="package-details-feature">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>

              {/* Company Information Card */}
              <div className="package-details-card">
                <div className="package-details-card-header">
                  <div className="package-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3>Travel Partner</h3>
                </div>
                <div className="package-details-company-info">
                  <div className="package-details-company-item">
                    <div className="package-details-company-label">Company</div>
                    <div className="package-details-company-value">{packageData.company?.companyName}</div>
                  </div>
                  <div className="package-details-company-item">
                    <div className="package-details-company-label">Email</div>
                    <div className="package-details-company-value">
                      <a href={`mailto:${packageData.company?.email}`}>{packageData.company?.email}</a>
                    </div>
                  </div>
                  <div className="package-details-company-item">
                    <div className="package-details-company-label">Phone</div>
                    <div className="package-details-company-value">
                      <a href={`tel:${packageData.company?.phone}`}>{packageData.company?.phone}</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="package-details-card">
                <div className="package-details-card-header">
                  <div className="package-reviews-header-left">
                    <div className="package-details-card-icon">
                      <Icon icon={['fas', 'star']} />
                    </div>
                    <h3>Customer Reviews</h3>
                  </div>
                  {reviews.length > 0 && (
                    <div className="package-reviews-summary">
                      <div className="package-reviews-average">
                        <Icon icon={['fas', 'star']} className="package-reviews-single-star" />
                        <span className="package-reviews-rating">{calculateAverageRating()}</span>
                        <span className="package-reviews-count">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="package-reviews-content">
                  {reviewsLoading ? (
                    <div className="package-reviews-loading">
                      <Icon icon={['fas', 'spinner']} spin />
                      <span>Loading reviews...</span>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="package-reviews-empty">
                      <Icon icon={['fas', 'comment-alt']} />
                      <h4>No reviews yet</h4>
                      <p>Be the first to book this package and share your experience!</p>
                    </div>
                  ) : (
                    <div className="package-reviews-list">
                      {reviews.slice(0, 1).map((review) => (
                        <div key={review.id} className="package-review-item">
                          <div className="package-review-header">
                            <div className="package-review-user">
                              <div className="package-review-avatar">
                                {review.customer?.name?.charAt(0) || 'U'}
                              </div>
                              <div className="package-review-user-info">
                                <div className="package-review-name">{review.customer?.name || 'Anonymous'}</div>
                                <div className="package-review-date">{formatDate(review.createdAt)}</div>
                              </div>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          
                          {review.title && (
                            <h5 className="package-review-title">{review.title}</h5>
                          )}
                          
                          {review.comment && (
                            <p className="package-review-comment">{review.comment}</p>
                          )}
                          
                          <div className="package-review-categories">
                            <div className="package-review-category">
                              <span>Service</span>
                              {renderStars(review.serviceRating)}
                            </div>
                            <div className="package-review-category">
                              <span>Accommodation</span>
                              {renderStars(review.accommodationRating)}
                            </div>
                            <div className="package-review-category">
                              <span>Transportation</span>
                              {renderStars(review.transportRating)}
                            </div>
                            <div className="package-review-category">
                              <span>Value</span>
                              {renderStars(review.valueRating)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {reviews.length > 0 && (
                        <div className="package-reviews-show-more">
                          <Link href={`/packages/${id}/reviews`} className="package-reviews-show-more-btn">
                            {reviews.length === 1 ? 'View this review' : `View all ${reviews.length} reviews`}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {imageModalOpen && selectedImage && (
          <div className="pkg-image-modal" onClick={closeImageModal}>
            <div className="pkg-image-modal-backdrop"></div>
            <div className="pkg-image-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="pkg-image-modal-header">
                <h3 className="pkg-image-modal-title">
                  {packageData.title} - Photos
                </h3>
                <button
                  className="pkg-image-modal-close"
                  onClick={closeImageModal}
                >
                  <Icon icon="times" />
                </button>
              </div>
              
              <div className="pkg-image-modal-body">
                <img
                  src={selectedImage}
                  alt={`${packageData.title} - Gallery`}
                  className="pkg-image-modal-image"
                />
                
                {packageData.images && packageData.images.length > 1 && (
                  <>
                    <button
                      className="pkg-image-modal-nav pkg-image-modal-prev"
                      onClick={prevImage}
                    >
                      <Icon icon="chevron-left" />
                    </button>
                    <button
                      className="pkg-image-modal-nav pkg-image-modal-next"
                      onClick={nextImage}
                    >
                      <Icon icon="chevron-right" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="pkg-image-modal-footer">
                <div className="pkg-image-modal-counter">
                  {packageData.images?.indexOf(selectedImage) + 1} of {packageData.images?.length}
                </div>
                <div className="pkg-image-modal-actions">
                  <a
                    href={selectedImage}
                    download={`${packageData.title}-photo-${packageData.images?.indexOf(selectedImage) + 1}.jpg`}
                    className="pkg-image-modal-download"
                  >
                    <Icon icon="download" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
