import { useState, useEffect } from 'react';
import Icon from '@/components/FontAwesome';

const CompanyDetailsModal = ({ company, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('packages');
  const [companyPackages, setCompanyPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      fetchCompanyDetails();
    }
  }, [isOpen, company]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${company.id}/details`);
      const data = await response.json();
      
      if (data.success) {
        setCompanyPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !company) return null;

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="company-modal-badge company-modal-badge-verified">
          <Icon icon={['fas', 'check-circle']} /> Verified
        </span>;
      case 'pending':
        return <span className="company-modal-badge company-modal-badge-pending">
          <Icon icon={['fas', 'clock']} /> Pending
        </span>;
      default:
        return <span className="company-modal-badge company-modal-badge-unverified">
          <Icon icon={['fas', 'exclamation-circle']} /> Unverified
        </span>;
    }
  };

  const getSubscriptionBadge = (plan) => {
    const planColors = {
      free: 'gray',
      basic: 'blue',
      professional: 'purple',
      enterprise: 'gold'
    };
    
    return <span className={`company-modal-badge company-modal-badge-${planColors[plan] || 'gray'}`}>
      <Icon icon={['fas', 'crown']} /> {plan?.charAt(0).toUpperCase() + plan?.slice(1) || 'Free'}
    </span>;
  };

  return (
    <div className="company-modal-overlay" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="company-modal-header">
          <button className="company-modal-close" onClick={onClose}>
            <Icon icon={['fas', 'times']} />
          </button>
          
          <div className="company-modal-company-info">
            <div className="company-modal-avatar">
              {company.profilePicture ? (
                <img src={company.profilePicture} alt={company.name} />
              ) : (
                <Icon icon={['fas', 'building']} />
              )}
            </div>
            
            <div className="company-modal-details">
              <h2>{company.name}</h2>
              <div className="company-modal-badges">
                {getVerificationBadge(company.verificationStatus)}
                {getSubscriptionBadge(company.subscriptionPlan)}
              </div>
              
              <div className="company-modal-stats">
                <div className="company-modal-stat">
                  <Icon icon={['fas', 'box']} />
                  <span>{company.packageCount} Packages</span>
                </div>
                <div className="company-modal-stat">
                  <Icon icon={['fas', 'star']} />
                  <span>{company.avgRating}/5 Rating</span>
                </div>
                <div className="company-modal-stat">
                  <Icon icon={['fas', 'calendar']} />
                  <span>Joined {new Date(company.joinedDate).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="company-modal-tabs">
          <button 
            className={`company-modal-tab ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Icon icon={['fas', 'box']} />
            Packages ({company.packageCount})
          </button>
          <button 
            className={`company-modal-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <Icon icon={['fas', 'phone']} />
            Contact Info
          </button>
          <button 
            className={`company-modal-tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Icon icon={['fas', 'star']} />
            Reviews
          </button>
        </div>

        <div className="company-modal-content">
          {activeTab === 'packages' && (
            <div className="company-modal-packages">
              {loading ? (
                <div className="company-modal-loading">
                  <Icon icon={['fas', 'spinner']} spin />
                  Loading packages...
                </div>
              ) : companyPackages.length > 0 ? (
                <div className="company-modal-packages-grid">
                  {companyPackages.map(pkg => (
                    <div key={pkg.id} className="company-modal-package-card">
                      <div className="company-modal-package-header">
                        <h4>{pkg.title}</h4>
                        <div className="company-modal-package-price">
                          ${pkg.price}
                        </div>
                      </div>
                      <div className="company-modal-package-details">
                        <div className="company-modal-package-meta">
                          <span><Icon icon={['fas', 'clock']} /> {pkg.duration} days</span>
                          <span><Icon icon={['fas', 'star']} /> {pkg.rating || 'No rating'}</span>
                        </div>
                        <p className="company-modal-package-description">
                          {pkg.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="company-modal-empty">
                  <Icon icon={['fas', 'box-open']} />
                  <p>No packages available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="company-modal-contact">
              <div className="company-modal-contact-item">
                <Icon icon={['fas', 'envelope']} />
                <div>
                  <label>Email</label>
                  <span>{company.email}</span>
                </div>
              </div>
              
              <div className="company-modal-contact-item">
                <Icon icon={['fas', 'phone']} />
                <div>
                  <label>Phone</label>
                  <span>{company.phone || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="company-modal-contact-item">
                <Icon icon={['fas', 'map-marker-alt']} />
                <div>
                  <label>Address</label>
                  <span>{company.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="company-modal-reviews">
              <div className="company-modal-reviews-summary">
                <div className="company-modal-rating-large">
                  <Icon icon={['fas', 'star']} />
                  <span>{company.avgRating}/5</span>
                </div>
                <p>Based on customer feedback from packages</p>
              </div>
              
              <div className="company-modal-empty">
                <Icon icon={['fas', 'comments']} />
                <p>Detailed reviews coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;