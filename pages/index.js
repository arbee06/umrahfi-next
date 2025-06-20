// File: pages/index.js
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="home-hero-landing">
        <div className="home-hero-background">
          <div className="home-hero-pattern"></div>
          <div className="home-hero-gradient"></div>
        </div>
        
        <div className="home-hero-content-wrapper">
          <div className="home-hero-content-main">
            <div className="home-hero-badge">
              <Icon icon="kaaba" className="home-badge-icon" />
              <span className="home-badge-text">Trusted by 10,000+ Pilgrims</span>
            </div>
            
            <h1 className="home-hero-title-main">
              Your Sacred Journey
              <span className="home-title-highlight"> Awaits</span>
            </h1>
            
            <p className="home-hero-description">
              Discover authentic Umrah experiences with trusted travel partners. 
              Book your spiritual journey with confidence, comfort, and peace of mind.
            </p>
            
            <div className="home-hero-actions">
              <Link href="/packages">
                <button className="btn btn-primary home-btn-hero">
                  <span>Explore Packages</span>
                  <Icon icon="arrow-right" className="home-btn-icon" />
                </button>
              </Link>
              
              {!isAuthenticated && (
                <Link href="/register">
                  <button className="btn btn-secondary home-btn-hero">
                    Get Started Free
                  </button>
                </Link>
              )}
            </div>

            <div className="home-hero-trust-indicators">
              <div className="home-trust-item">
                <Icon icon="shield-alt" className="home-trust-icon" />
                <span className="home-trust-text">Verified Partners</span>
              </div>
              <div className="home-trust-item">
                <Icon icon="star" className="home-trust-icon" />
                <span className="home-trust-text">4.9/5 Rating</span>
              </div>
              <div className="home-trust-item">
                <Icon icon="headset" className="home-trust-icon" />
                <span className="home-trust-text">24/7 Support</span>
              </div>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-floating-cards">
              <div className="home-floating-card home-card-1">
                <div className="home-card-content">
                  <Icon icon="kaaba" className="home-card-icon" />
                  <div className="home-card-text">
                    <div className="home-card-title">Premium Package</div>
                    <div className="home-card-price">From $2,499</div>
                  </div>
                </div>
              </div>
              
              <div className="home-floating-card home-card-2">
                <div className="home-card-content">
                  <Icon icon="plane" className="home-card-icon" />
                  <div className="home-card-text">
                    <div className="home-card-title">Direct Flights</div>
                    <div className="home-card-subtitle">No Layovers</div>
                  </div>
                </div>
              </div>
              
              <div className="home-floating-card home-card-3">
                <div className="home-card-content">
                  <Icon icon="hotel" className="home-card-icon" />
                  <div className="home-card-text">
                    <div className="home-card-title">5-Star Hotels</div>
                    <div className="home-card-subtitle">Near Haram</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="home-main-content-wrapper">
        {/* Features Section */}
        <section className="home-features-section">
          <div className="home-section-header">
            <div className="home-section-badge">
              <span>Why Choose Umrahfi</span>
            </div>
            <h2 className="home-section-title">
              Your Trusted Partner for Sacred Journeys
            </h2>
            <p className="home-section-subtitle">
              We connect you with verified travel companies offering authentic 
              Umrah experiences tailored to your needs and budget.
            </p>
          </div>

          <div className="home-features-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon verified">
                <Icon icon="check-circle" />
              </div>
              <div className="home-feature-content">
                <h3 className="home-feature-title">Verified Partners</h3>
                <p className="home-feature-description">
                  All travel companies are thoroughly vetted and licensed 
                  to ensure your safety and complete satisfaction.
                </p>
                <div className="home-feature-stats">
                  <span className="home-stat-number">50+</span>
                  <span className="home-stat-label">Trusted Partners</span>
                </div>
              </div>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon pricing">
                <Icon icon="dollar-sign" />
              </div>
              <div className="home-feature-content">
                <h3 className="home-feature-title">Best Prices Guaranteed</h3>
                <p className="home-feature-description">
                  Compare packages from multiple providers to find 
                  the best value for your sacred journey.
                </p>
                <div className="home-feature-stats">
                  <span className="home-stat-number">30%</span>
                  <span className="home-stat-label">Average Savings</span>
                </div>
              </div>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon support">
                <Icon icon="headset" />
              </div>
              <div className="home-feature-content">
                <h3 className="home-feature-title">24/7 Expert Support</h3>
                <p className="home-feature-description">
                  Our dedicated support team is available around the clock 
                  to assist you throughout your entire journey.
                </p>
                <div className="home-feature-stats">
                  <span className="home-stat-number">24/7</span>
                  <span className="home-stat-label">Always Available</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role-based CTA Section */}
        <section className="home-cta-section">
          <div className="home-cta-grid">
            <div className="home-cta-card home-pilgrim-card">
              <div className="home-cta-background"></div>
              <div className="home-cta-content">
                <div className="home-cta-icon">
                  <Icon icon="user" />
                </div>
                <div className="home-cta-text">
                  <h3 className="home-cta-title">For Pilgrims</h3>
                  <p className="home-cta-description">
                    Find and book the perfect Umrah package that suits your 
                    spiritual needs, schedule, and budget preferences.
                  </p>
                  <div className="home-cta-features">
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Compare 100+ packages</span>
                    </div>
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Instant booking confirmation</span>
                    </div>
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Flexible payment options</span>
                    </div>
                  </div>
                  <div className="home-cta-action">
                    {!isAuthenticated ? (
                      <Link href="/register?type=customer">
                        <button className="btn btn-primary home-btn-cta">
                          Start Your Journey
                          <Icon icon="arrow-right" className="home-btn-arrow" />
                        </button>
                      </Link>
                    ) : user?.role === 'customer' ? (
                      <Link href="/packages">
                        <button className="btn btn-primary home-btn-cta">
                          Browse Packages
                          <Icon icon="arrow-right" className="home-btn-arrow" />
                        </button>
                      </Link>
                    ) : (
                      <Link href="/packages">
                        <button className="btn btn-secondary home-btn-cta">
                          View Packages
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="home-cta-card home-company-card">
              <div className="home-cta-background"></div>
              <div className="home-cta-content">
                <div className="home-cta-icon">
                  <Icon icon="building" />
                </div>
                <div className="home-cta-text">
                  <h3 className="home-cta-title">For Travel Companies</h3>
                  <p className="home-cta-description">
                    Showcase your Umrah packages to thousands of potential 
                    customers and grow your business with our platform.
                  </p>
                  <div className="home-cta-features">
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Reach 10,000+ active users</span>
                    </div>
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Easy package management</span>
                    </div>
                    <div className="home-cta-feature">
                      <Icon icon="check" className="home-feature-check" />
                      <span>Automated booking system</span>
                    </div>
                  </div>
                  <div className="home-cta-action">
                    {!isAuthenticated ? (
                      <Link href="/register?type=company">
                        <button className="btn btn-primary home-btn-cta">
                          List Your Packages
                          <Icon icon="arrow-right" className="home-btn-arrow" />
                        </button>
                      </Link>
                    ) : user?.role === 'company' ? (
                      <Link href="/company/packages/create">
                        <button className="btn btn-primary home-btn-cta">
                          Add New Package
                          <Icon icon="arrow-right" className="home-btn-arrow" />
                        </button>
                      </Link>
                    ) : (
                      <Link href="/register?type=company">
                        <button className="btn btn-secondary home-btn-cta">
                          Partner With Us
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="home-stats-section">
          <div className="home-stats-container">
            <div className="home-stats-header">
              <h2 className="home-stats-title">
                Trusted by Thousands of Pilgrims Worldwide
              </h2>
              <p className="home-stats-subtitle">
                Join the growing community of satisfied pilgrims who chose Umrahfi for their sacred journey
              </p>
            </div>
            
            <div className="home-stats-grid">
              <div className="home-stat-card">
                <div className="home-stat-icon">
                  <Icon icon="kaaba" className="home-stat-emoji" />
                </div>
                <div className="home-stat-content">
                  <div className="home-stat-number">10,000+</div>
                  <div className="home-stat-label">Happy Pilgrims</div>
                  <div className="home-stat-description">Successfully completed their Umrah journey</div>
                </div>
              </div>
              
              <div className="home-stat-card">
                <div className="home-stat-icon">
                  <Icon icon="building" className="home-stat-emoji" />
                </div>
                <div className="home-stat-content">
                  <div className="home-stat-number">50+</div>
                  <div className="home-stat-label">Verified Partners</div>
                  <div className="home-stat-description">Licensed travel companies you can trust</div>
                </div>
              </div>
              
              <div className="home-stat-card">
                <div className="home-stat-icon">
                  <Icon icon="suitcase" className="home-stat-emoji" />
                </div>
                <div className="home-stat-content">
                  <div className="home-stat-number">200+</div>
                  <div className="home-stat-label">Active Packages</div>
                  <div className="home-stat-description">Curated options for every budget</div>
                </div>
              </div>
              
              <div className="home-stat-card">
                <div className="home-stat-icon">
                  <Icon icon="star" className="home-stat-emoji" />
                </div>
                <div className="home-stat-content">
                  <div className="home-stat-number">4.9/5</div>
                  <div className="home-stat-label">Customer Rating</div>
                  <div className="home-stat-description">Based on 2,000+ verified reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="home-final-cta-section">
          <div className="home-final-cta-container">
            <div className="home-final-cta-content">
              <div className="home-final-cta-badge">
                <Icon icon="kaaba" />
                <span>Begin Your Sacred Journey</span>
              </div>
              
              <h2 className="home-final-cta-title">
                Ready to Embark on Your Spiritual Journey?
              </h2>
              
              <p className="home-final-cta-description">
                Take the first step towards your life-changing pilgrimage. 
                Browse our carefully curated packages or speak with our Umrah experts.
              </p>
              
              <div className="home-final-cta-actions">
                <Link href="/packages">
                  <button className="btn btn-primary home-btn-final">
                    <span>Explore All Packages</span>
                    <Icon icon="arrow-right" className="home-btn-icon" />
                  </button>
                </Link>
                
                <Link href="/contact">
                  <button className="btn btn-ghost home-btn-final">
                    <span>Talk to an Expert</span>
                    <Icon icon="comments" className="home-btn-icon" />
                  </button>
                </Link>
              </div>

              <div className="home-final-cta-guarantee">
                <div className="home-guarantee-item">
                  <Icon icon="lock" className="home-guarantee-icon" />
                  <span className="home-guarantee-text">Secure Booking</span>
                </div>
                <div className="home-guarantee-item">
                  <Icon icon="dollar-sign" className="home-guarantee-icon" />
                  <span className="home-guarantee-text">Best Price Guarantee</span>
                </div>
                <div className="home-guarantee-item">
                  <Icon icon="headset" className="home-guarantee-icon" />
                  <span className="home-guarantee-text">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}