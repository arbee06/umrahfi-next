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
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
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
              <Link href="/packages" className="package-details-btn-primary">
                <span>Browse All Packages</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
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
              <Link href="/packages" className="package-details-breadcrumb-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to Packages</span>
              </Link>
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

          {/* Image Gallery */}
          {packageData.images && packageData.images.length > 0 && (
            <div className="pkg-gallery">
              <div className="pkg-gallery-header">
                <h3 className="pkg-gallery-title">
                  <Icon icon="images" />
                  Package Photos ({packageData.images.length})
                </h3>
              </div>
              <div className="pkg-gallery-grid">
                {packageData.images.slice(0, 6).map((image, index) => (
                  <div 
                    key={index} 
                    className="pkg-gallery-item"
                    onClick={() => openImageModal(image)}
                  >
                    <img
                      src={image}
                      alt={`${packageData.title} - Photo ${index + 1}`}
                      className="pkg-gallery-image"
                    />
                    <div className="pkg-gallery-overlay">
                      <Icon icon="expand" />
                    </div>
                    {index === 5 && packageData.images.length > 6 && (
                      <div className="pkg-gallery-more">
                        <span>+{packageData.images.length - 6} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="package-details-grid">
            {/* Left Column - Package Information */}
            <div className="package-details-main">
              {/* Trip Information Card */}
              <div className="package-details-card">
                <div className="package-details-card-header">
                  <div className="package-details-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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
                  {(packageData.departureAirport || packageData.arrivalAirport) && (
                    <div className="package-details-info-item">
                      <div className="package-details-info-label">Flight Route</div>
                      <div className="package-details-info-value">
                        {packageData.departureAirport && getAirportByCode(packageData.departureAirport) ? 
                          `${packageData.departureAirport} (${getAirportByCode(packageData.departureAirport).city})` : 
                          packageData.departureAirport || 'Various'
                        }
                        {packageData.transitAirport && ` → ${packageData.transitAirport}`}
                        {packageData.arrivalAirport && ` → ${packageData.arrivalAirport} (${getAirportByCode(packageData.arrivalAirport)?.city || 'Saudi Arabia'})`}
                      </div>
                    </div>
                  )}
                </div>
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
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Hotel</div>
                    <div className="package-details-info-value">{packageData.hotelName}</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Rating</div>
                    <div className="package-details-info-value">
                      <div className="package-details-rating">
                        {[...Array(packageData.hotelRating)].map((_, i) => (
                          <svg key={i} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span>({packageData.hotelRating}★)</span>
                      </div>
                    </div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Meal Plan</div>
                    <div className="package-details-info-value">{packageData.mealPlan}</div>
                  </div>
                  <div className="package-details-info-item">
                    <div className="package-details-info-label">Transportation</div>
                    <div className="package-details-info-value">{packageData.transportation}</div>
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
