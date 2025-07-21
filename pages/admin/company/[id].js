import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';
import { getAllPlans, getSubscriptionPlan, formatLimit } from '@/config/subscriptionPlans';

export default function CompanyProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [packages, setPackages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [subscriptionPlans] = useState(getAllPlans());
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageFormData, setPackageFormData] = useState({
    title: '',
    description: '',
    price: '',
    childPrice: '',
    duration: '',
    departureDate: '',
    returnDate: '',
    availableSeats: '',
    totalSeats: '',
    makkahDays: '',
    madinaDays: '',
    mealPlan: 'Breakfast',
    transportation: 'Flight',
    transportationProvider: '',
    inclusions: [],
    exclusions: [],
    departureAirports: [],
    arrivalAirports: [],
    makkahHotels: [],
    madinahHotels: []
  });

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchCompanyPackages();
      fetchCompanyDocuments();
      fetchCompanySubscriptions();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUser(id);
      setCompany(data);
      setVerificationNotes(data.verificationNotes || '');
    } catch (error) {
      console.error('Error fetching company details:', error);
      Swal.fire('Error', 'Failed to fetch company details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyPackages = async () => {
    try {
      const response = await fetch(`/api/admin/company-packages?companyId=${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchCompanyDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/company-documents?companyId=${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchCompanySubscriptions = async () => {
    try {
      const response = await fetch(`/api/admin/company-subscriptions?companyId=${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleVerificationAction = async (action) => {
    let confirmConfig = {};
    
    if (action === 'approve') {
      confirmConfig = {
        title: 'Approve Company Verification?',
        text: 'This company will be marked as verified and trusted.',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Yes, Approve!'
      };
    } else if (action === 'reject') {
      confirmConfig = {
        title: 'Reject Company Verification?',
        text: 'This company will be marked as rejected. Please provide a reason.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Reject!'
      };
    }

    const result = await Swal.fire({
      ...confirmConfig,
      input: action === 'reject' ? 'textarea' : undefined,
      inputPlaceholder: action === 'reject' ? 'Enter rejection reason...' : undefined,
      inputValidator: action === 'reject' ? (value) => {
        if (!value) return 'Please provide a reason for rejection';
      } : undefined,
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const updateData = {
          verificationStatus: action === 'approve' ? 'approved' : 'rejected',
          isVerified: action === 'approve',
          verificationDate: new Date().toISOString(),
          verifiedBy: user.id,
          verificationNotes: verificationNotes,
        };

        if (action === 'reject') {
          updateData.rejectionReason = result.value;
        }

        await adminService.updateUser(id, updateData);
        
        soundManager.playLogin();
        await Swal.fire({
          title: 'Success!',
          text: `Company verification ${action}d successfully`,
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 3000,
          timerProgressBar: true
        });

        fetchCompanyDetails();
      } catch (error) {
        console.error('Error updating verification:', error);
        Swal.fire('Error', `Failed to ${action} verification`, 'error');
      }
    }
  };

  const handleToggleActive = async () => {
    const action = company.isActive ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Company?`,
      text: company.isActive 
        ? 'This will prevent the company from accessing the platform.'
        : 'This will allow the company to access the platform.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: company.isActive ? '#dc2626' : '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}!`
    });

    if (result.isConfirmed) {
      try {
        await adminService.updateUser(id, { isActive: !company.isActive });
        soundManager.playAction();
        Swal.fire({
          title: 'Success!',
          text: `Company ${action}d successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCompanyDetails();
      } catch (error) {
        Swal.fire('Error', `Failed to ${action} company`, 'error');
      }
    }
  };

  const handleSubscriptionAction = async (action) => {
    let confirmConfig = {};
    
    switch (action) {
      case 'change-plan':
        const { value: planId } = await Swal.fire({
          title: 'Select New Plan',
          input: 'select',
          inputOptions: subscriptionPlans.reduce((options, plan) => {
            options[plan.id] = `${plan.name} - $${plan.price}/month`;
            return options;
          }, {}),
          inputPlaceholder: 'Select a plan',
          showCancelButton: true,
          confirmButtonText: 'Change Plan',
          confirmButtonColor: '#3b82f6',
          inputValidator: (value) => {
            if (!value) {
              return 'Please select a plan';
            }
          }
        });
        
        if (planId) {
          const plan = getSubscriptionPlan(planId);
          const result = await Swal.fire({
            title: `Change to ${plan.name}?`,
            text: `This will change the subscription to ${plan.name} ($${plan.price}/month)`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, Change Plan!'
          });
          
          if (result.isConfirmed) {
            await updateSubscription(action, planId);
          }
        }
        return;
        
      case 'cancel':
        confirmConfig = {
          title: 'Cancel Subscription?',
          text: 'This will cancel the company subscription.',
          icon: 'warning',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Yes, Cancel!'
        };
        break;
        
      case 'activate':
        confirmConfig = {
          title: 'Activate Subscription?',
          text: 'This will activate the company subscription.',
          icon: 'success',
          confirmButtonColor: '#059669',
          confirmButtonText: 'Yes, Activate!'
        };
        break;
        
      case 'extend':
        const { value: days } = await Swal.fire({
          title: 'Extend Subscription',
          text: 'How many days would you like to extend the subscription?',
          input: 'number',
          inputValue: 30,
          inputAttributes: {
            min: 1,
            max: 365,
            step: 1
          },
          showCancelButton: true,
          confirmButtonText: 'Extend',
          confirmButtonColor: '#3b82f6',
          inputValidator: (value) => {
            if (!value || value < 1 || value > 365) {
              return 'Please enter a number between 1 and 365';
            }
          }
        });
        
        if (days) {
          const result = await Swal.fire({
            title: 'Extend Subscription?',
            text: `This will extend the subscription by ${days} days.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, Extend!'
          });
          
          if (result.isConfirmed) {
            await updateSubscription(action, null, days);
          }
        }
        return;
    }

    const result = await Swal.fire({
      ...confirmConfig,
      input: action === 'cancel' ? 'textarea' : undefined,
      inputPlaceholder: action === 'cancel' ? 'Enter reason for cancellation...' : undefined,
      inputValidator: action === 'cancel' ? (value) => {
        if (!value) return 'Please provide a reason for cancellation';
      } : undefined,
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      await updateSubscription(action, null, null, result.value);
    }
  };

  const updateSubscription = async (action, planId = null, days = null, reason = null) => {
    try {
      const updateData = {
        action,
        planId,
        days,
        reason,
        adminId: user.id
      };

      const response = await fetch(`/api/admin/company-subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        soundManager.playLogin();
        await Swal.fire({
          title: 'Success!',
          text: `Subscription ${action}d successfully`,
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 3000,
          timerProgressBar: true
        });

        fetchCompanyDetails();
        fetchCompanySubscriptions();
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      Swal.fire('Error', `Failed to ${action} subscription`, 'error');
    }
  };

  const getVerificationStatusBadge = () => {
    if (!company?.verificationStatus) return null;
    
    const statusConfig = {
      approved: { color: 'success', icon: 'check-circle', text: 'Verified' },
      pending: { color: 'warning', icon: 'clock', text: 'Pending' },
      rejected: { color: 'danger', icon: 'times-circle', text: 'Rejected' },
      not_submitted: { color: 'secondary', icon: 'file', text: 'Not Submitted' }
    };

    const config = statusConfig[company.verificationStatus];
    return (
      <span className={`admin-badge admin-badge-${config.color}`}>
        <Icon icon={['fas', config.icon]} className="admin-badge-icon" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDocumentIcon = (type) => {
    const icons = {
      license: 'certificate',
      registration: 'file-alt',
      insurance: 'shield-alt',
      other: 'paperclip'
    };
    return icons[type] || 'file';
  };

  const getPackageApprovalBadge = (adminApprovalStatus) => {
    const statusConfig = {
      approved: { color: 'success', icon: 'check-circle', text: 'Approved' },
      pending: { color: 'warning', icon: 'clock', text: 'Pending Approval' },
      rejected: { color: 'danger', icon: 'times-circle', text: 'Rejected' }
    };

    const config = statusConfig[adminApprovalStatus] || statusConfig.pending;
    return (
      <span className={`admin-badge admin-badge-${config.color}`}>
        <Icon icon={['fas', config.icon]} className="admin-badge-icon" />
        {config.text}
      </span>
    );
  };

  const handleCreatePackage = () => {
    setEditingPackage(null);
    setPackageFormData({
      title: '',
      description: '',
      price: '',
      childPrice: '',
      duration: '',
      departureDate: '',
      returnDate: '',
      availableSeats: '',
      totalSeats: '',
      makkahDays: '',
      madinaDays: '',
      mealPlan: 'Breakfast',
      transportation: 'Flight',
      transportationProvider: '',
      inclusions: [],
      exclusions: [],
      departureAirports: [],
      arrivalAirports: [],
      makkahHotels: [],
      madinahHotels: []
    });
    setShowPackageModal(true);
  };

  const handleEditPackage = (packageData) => {
    setEditingPackage(packageData);
    setPackageFormData({
      title: packageData.title || '',
      description: packageData.description || '',
      price: packageData.price || '',
      childPrice: packageData.childPrice || '',
      duration: packageData.duration || '',
      departureDate: packageData.departureDate ? new Date(packageData.departureDate).toISOString().split('T')[0] : '',
      returnDate: packageData.returnDate ? new Date(packageData.returnDate).toISOString().split('T')[0] : '',
      availableSeats: packageData.availableSeats || '',
      totalSeats: packageData.totalSeats || '',
      makkahDays: packageData.makkahDays || '',
      madinaDays: packageData.madinaDays || '',
      mealPlan: packageData.mealPlan || 'Breakfast',
      transportation: packageData.transportation || 'Flight',
      transportationProvider: packageData.transportationProvider || '',
      inclusions: packageData.inclusions || [],
      exclusions: packageData.exclusions || [],
      departureAirports: packageData.departureAirports || [],
      arrivalAirports: packageData.arrivalAirports || [],
      makkahHotels: packageData.makkahHotels || [],
      madinahHotels: packageData.madinahHotels || []
    });
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    
    if (!packageFormData.title || !packageFormData.description || !packageFormData.price) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    try {
      const submitData = {
        ...packageFormData,
        companyId: id,
        adminApprovalStatus: 'approved' // Admin created packages are auto-approved
      };

      if (editingPackage) {
        await fetch(`/api/admin/packages/${editingPackage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        soundManager.playAction();
        Swal.fire({
          title: 'Success!',
          text: 'Package updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await fetch('/api/admin/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        soundManager.playLogin();
        Swal.fire({
          title: 'Success!',
          text: 'Package created successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setShowPackageModal(false);
      fetchCompanyPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      Swal.fire('Error', 'Failed to save package', 'error');
    }
  };

  const handlePackageApproval = async (packageId, action) => {
    let confirmConfig = {};
    
    if (action === 'approve') {
      confirmConfig = {
        title: 'Approve Package?',
        text: 'This package will be made available to customers.',
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Yes, Approve!'
      };
    } else if (action === 'reject') {
      confirmConfig = {
        title: 'Reject Package?',
        text: 'This package will be rejected and not available to customers.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Reject!'
      };
    }

    const result = await Swal.fire({
      ...confirmConfig,
      input: action === 'reject' ? 'textarea' : undefined,
      inputPlaceholder: action === 'reject' ? 'Enter rejection reason...' : undefined,
      inputValidator: action === 'reject' ? (value) => {
        if (!value) return 'Please provide a reason for rejection';
      } : undefined,
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const updateData = {
          adminApprovalStatus: action === 'approve' ? 'approved' : 'rejected',
          approvedBy: user.id,
          approvedAt: new Date().toISOString(),
          adminNotes: '',
        };

        if (action === 'reject') {
          updateData.rejectionReason = result.value;
        }

        await fetch(`/api/admin/packages/${packageId}/approval`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });

        soundManager.playLogin();
        await Swal.fire({
          title: 'Success!',
          text: `Package ${action}d successfully`,
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 3000,
          timerProgressBar: true
        });

        fetchCompanyPackages();
      } catch (error) {
        console.error('Error updating package approval:', error);
        Swal.fire('Error', `Failed to ${action} package`, 'error');
      }
    }
  };

  const handleClosePackageModal = () => {
    setShowPackageModal(false);
    setEditingPackage(null);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem'}}>
            <Icon icon={['fas', 'spinner']} spin size="3x" color="#10b981" />
            <p style={{color: '#6b7280', fontSize: '1.1rem'}}>Loading company details...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!company) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <div className="admin-error-container">
            <Icon icon={['fas', 'exclamation-triangle']} size="3x" />
            <h3>Company Not Found</h3>
            <p>The company you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => router.push('/admin/companies')} className="admin-btn admin-btn-primary">
              Back to Companies
            </button>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="customer-profile-container">
          {/* Header */}
          <div className="customer-profile-header">
            <div className="customer-profile-header-content">
              <div className="customer-profile-header-text">
                <button 
                  onClick={() => router.push('/admin/companies')} 
                  className="customer-profile-upload-btn"
                  style={{marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.15)'}}
                >
                  <Icon icon={['fas', 'arrow-left']} />
                  Back to Companies
                </button>
                
                <h1 className="customer-profile-header-title" style={{color: 'white'}}>
                  {company.companyName}
                </h1>
                <p className="customer-profile-header-subtitle">
                  Contact: {company.name} • {company.isActive ? 'Active' : 'Inactive'} • {getVerificationStatusBadge()?.props?.children[1] || 'Not Verified'}
                </p>
                
                <div style={{marginTop: '1rem'}}>
                  <button 
                    onClick={handleToggleActive}
                    className="customer-profile-upload-btn"
                    style={{background: company.isActive ? '#ef4444' : '#10b981'}}
                  >
                    <Icon icon={['fas', company.isActive ? 'ban' : 'check']} />
                    {company.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div className="customer-profile-header-actions">
                <div className="customer-profile-avatar-section">
                  <img
                    src={company.profilePicture || '/images/default-profile.svg'}
                    alt={company.companyName}
                    className="customer-profile-avatar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="customer-profile-tabs">
            <button 
              className={`customer-profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Icon icon={['fas', 'info-circle']} />
              Overview
            </button>
            <button 
              className={`customer-profile-tab ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              <Icon icon={['fas', 'box']} />
              Packages ({packages.length})
            </button>
            <button 
              className={`customer-profile-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <Icon icon={['fas', 'file-alt']} />
              Documents ({documents.length})
            </button>
            <button 
              className={`customer-profile-tab ${activeTab === 'verification' ? 'active' : ''}`}
              onClick={() => setActiveTab('verification')}
            >
              <Icon icon={['fas', 'shield-alt']} />
              Verification
            </button>
            <button 
              className={`customer-profile-tab ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <Icon icon={['fas', 'credit-card']} />
              Subscription
            </button>
          </div>

          {/* Content */}
          <div className="customer-profile-form">
            {activeTab === 'overview' && (
              <>
                {/* Company Information Section */}
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'building']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Company Information</h2>
                  </div>
                  
                  <div className="customer-profile-form-grid">
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Company Name</label>
                      <input type="text" value={company.companyName} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">License Number</label>
                      <input type="text" value={company.companyLicense || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Country</label>
                      <input type="text" value={company.country || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group customer-profile-form-grid-full">
                      <label className="customer-profile-form-label">Company Address</label>
                      <textarea value={company.companyAddress || 'Not provided'} disabled className="customer-profile-form-textarea customer-profile-disabled-input" rows="3" />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'user']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Contact Information</h2>
                  </div>
                  
                  <div className="customer-profile-form-grid">
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Contact Person</label>
                      <input type="text" value={company.name} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Email</label>
                      <input type="email" value={company.email} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Phone</label>
                      <input type="text" value={company.phone || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Member Since</label>
                      <input type="text" value={formatDate(company.createdAt)} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                  </div>
                </div>

                {/* Payment Information Section */}
                <div className="customer-profile-form-section">
                  <div className="customer-profile-section-header">
                    <Icon icon={['fas', 'credit-card']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Payment Information</h2>
                  </div>
                  
                  <div className="customer-profile-form-grid">
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Bank Name</label>
                      <input type="text" value={company.bankName || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Account Number</label>
                      <input type="text" value={company.bankAccountNumber || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Account Holder</label>
                      <input type="text" value={company.bankAccountHolderName || 'Not provided'} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Processing Fee</label>
                      <input type="text" value={`${company.paymentProcessingFee || 2.9}%`} disabled className="customer-profile-form-input customer-profile-disabled-input" />
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="customer-profile-stats">
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'box']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{packages.length}</span>
                      <span className="customer-profile-stat-label">Total Packages</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'file-alt']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{documents.length}</span>
                      <span className="customer-profile-stat-label">Documents</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'shield-check']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">{company.verificationStatus === 'approved' ? 'Verified' : 'Pending'}</span>
                      <span className="customer-profile-stat-label">Verification</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'packages' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header" style={{justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <Icon icon={['fas', 'box']} className="customer-profile-section-icon" />
                    <h2 className="customer-profile-section-title">Company Packages</h2>
                  </div>
                  <button onClick={handleCreatePackage} className="customer-profile-btn-secondary">
                    <Icon icon={['fas', 'plus']} />
                    Create Package
                  </button>
                </div>
                
                {packages.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                    <Icon icon={['fas', 'box']} size="3x" style={{opacity: 0.5, marginBottom: '1rem'}} />
                    <h3>No packages found</h3>
                    <p>This company hasn't created any packages yet.</p>
                  </div>
                ) : (
                  <div className="customer-profile-activity-list">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="customer-profile-activity-item">
                        <div className="customer-profile-activity-icon">
                          <Icon icon={['fas', 'box']} />
                        </div>
                        <div className="customer-profile-activity-content" style={{flex: 1}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                            <p style={{fontWeight: 600, marginBottom: 0}}>{pkg.title}</p>
                            <div style={{display: 'flex', gap: '0.5rem'}}>
                              {getPackageApprovalBadge(pkg.adminApprovalStatus)}
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background: pkg.status === 'active' ? '#d1fae5' : '#fee2e2',
                                color: pkg.status === 'active' ? '#065f46' : '#991b1b'
                              }}>
                                {pkg.status}
                              </span>
                            </div>
                          </div>
                          <p style={{color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem'}}>{pkg.description}</p>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem'}}>
                            <span>💰 ${pkg.price}</span>
                            <span>🕐 {pkg.duration} days</span>
                            <span>👥 {pkg.availableSeats}/{pkg.totalSeats} seats</span>
                            <span>📅 {formatDate(pkg.departureDate)}</span>
                            <span>
                              {pkg.transportation === 'Flight' ? '✈️' : 
                               pkg.transportation === 'Bus' ? '🚌' : 
                               pkg.transportation === 'Train' ? '🚂' : '🚗'} 
                              {pkg.transportationProvider || 'Not specified'}
                            </span>
                          </div>
                          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                            <button 
                              onClick={() => handleEditPackage(pkg)}
                              className="customer-profile-btn-secondary"
                              style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem'}}
                            >
                              <Icon icon={['fas', 'edit']} />
                              Edit
                            </button>
                            
                            {pkg.adminApprovalStatus === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handlePackageApproval(pkg.id, 'approve')}
                                  style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                                >
                                  <Icon icon={['fas', 'check']} />
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handlePackageApproval(pkg.id, 'reject')}
                                  style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                                >
                                  <Icon icon={['fas', 'times']} />
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {pkg.adminApprovalStatus === 'approved' && (
                              <button 
                                onClick={() => handlePackageApproval(pkg.id, 'reject')}
                                style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                              >
                                <Icon icon={['fas', 'ban']} />
                                Revoke
                              </button>
                            )}
                            
                            {pkg.adminApprovalStatus === 'rejected' && (
                              <button 
                                onClick={() => handlePackageApproval(pkg.id, 'approve')}
                                style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                              >
                                <Icon icon={['fas', 'check']} />
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'file-alt']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Company Documents</h2>
                </div>
                
                {documents.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                    <Icon icon={['fas', 'file-alt']} size="3x" style={{opacity: 0.5, marginBottom: '1rem'}} />
                    <h3>No documents found</h3>
                    <p>This company hasn't uploaded any documents yet.</p>
                  </div>
                ) : (
                  <div className="customer-profile-activity-list">
                    {documents.map((doc) => (
                      <div key={doc.id} className="customer-profile-activity-item">
                        <div className="customer-profile-activity-icon">
                          <Icon icon={['fas', getDocumentIcon(doc.documentType)]} />
                        </div>
                        <div className="customer-profile-activity-content" style={{flex: 1}}>
                          <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>{doc.documentName}</p>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>
                            <span>📄 {doc.documentType}</span>
                            <span>📅 Uploaded {formatDate(doc.uploadedAt)}</span>
                          </div>
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            {doc.verificationStatus === 'pending' && (
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#fef3c7',
                                color: '#92400e'
                              }}>
                                Pending Review
                              </span>
                            )}
                            {doc.verificationStatus === 'approved' && (
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#d1fae5',
                                color: '#065f46'
                              }}>
                                ✓ Approved
                              </span>
                            )}
                            {doc.verificationStatus === 'rejected' && (
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b'
                              }}>
                                ✗ Rejected
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                          <button className="customer-profile-btn-secondary">
                            <Icon icon={['fas', 'download']} />
                            Download
                          </button>
                          {doc.verificationStatus === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleDocumentApproval(doc.id, 'approve')}
                                style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                              >
                                <Icon icon={['fas', 'check']} />
                                Approve
                              </button>
                              <button 
                                onClick={() => handleDocumentApproval(doc.id, 'reject')}
                                style={{fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem'}}
                              >
                                <Icon icon={['fas', 'times']} />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'shield-alt']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Company Verification</h2>
                </div>

                <div className="customer-profile-form-grid">
                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Current Status</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      {getVerificationStatusBadge()}
                      {company.verificationDate && (
                        <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                          Verified on {formatDate(company.verificationDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {company.rejectionReason && (
                    <div className="customer-profile-form-group customer-profile-form-grid-full">
                      <label className="customer-profile-form-label">Rejection Reason</label>
                      <div style={{padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem'}}>
                        {company.rejectionReason}
                      </div>
                    </div>
                  )}

                  <div className="customer-profile-form-group customer-profile-form-grid-full">
                    <label className="customer-profile-form-label">Admin Notes</label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add notes about this company's verification..."
                      className="customer-profile-form-textarea"
                      rows="4"
                    />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                  <button 
                    onClick={() => handleVerificationAction('approve')}
                    className="customer-profile-btn-primary"
                    disabled={company.verificationStatus === 'approved'}
                  >
                    <Icon icon={['fas', 'check']} />
                    Approve Verification
                  </button>
                  <button 
                    onClick={() => handleVerificationAction('reject')}
                    style={{
                      background: company.verificationStatus === 'rejected' ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      cursor: company.verificationStatus === 'rejected' ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    disabled={company.verificationStatus === 'rejected'}
                  >
                    <Icon icon={['fas', 'times']} />
                    Reject Verification
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="customer-profile-form-section">
                <div className="customer-profile-section-header">
                  <Icon icon={['fas', 'credit-card']} className="customer-profile-section-icon" />
                  <h2 className="customer-profile-section-title">Company Subscription</h2>
                </div>

                {/* Current Plan Overview */}
                <div className="customer-profile-stats" style={{marginBottom: '2rem'}}>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'star']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">
                        {company.subscriptionPlan ? getSubscriptionPlan(company.subscriptionPlan)?.name || 'Unknown' : 'None'}
                      </span>
                      <span className="customer-profile-stat-label">Current Plan</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'money-bill-wave']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">
                        ${company.subscriptionPlan ? getSubscriptionPlan(company.subscriptionPlan)?.price || 0 : 0}/mo
                      </span>
                      <span className="customer-profile-stat-label">Monthly Cost</span>
                    </div>
                  </div>
                  <div className="customer-profile-stat-card">
                    <Icon icon={['fas', 'calendar-times']} className="customer-profile-stat-icon" />
                    <div className="customer-profile-stat-content">
                      <span className="customer-profile-stat-value">
                        {company.subscriptionEndDate ? formatDate(company.subscriptionEndDate) : 'N/A'}
                      </span>
                      <span className="customer-profile-stat-label">Expires</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="customer-profile-form-grid" style={{marginBottom: '2rem'}}>
                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Subscription Status</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backgroundColor: company.subscriptionPlan ? '#d1fae5' : '#fee2e2',
                        color: company.subscriptionPlan ? '#065f46' : '#991b1b'
                      }}>
                        {company.subscriptionPlan ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="customer-profile-form-group">
                    <label className="customer-profile-form-label">Started Date</label>
                    <input 
                      type="text" 
                      value={company.subscriptionStartDate ? formatDate(company.subscriptionStartDate) : 'N/A'} 
                      disabled 
                      className="customer-profile-form-input customer-profile-disabled-input" 
                    />
                  </div>
                  {company.trialEndDate && (
                    <div className="customer-profile-form-group">
                      <label className="customer-profile-form-label">Trial End Date</label>
                      <input 
                        type="text" 
                        value={formatDate(company.trialEndDate)} 
                        disabled 
                        className="customer-profile-form-input customer-profile-disabled-input" 
                      />
                    </div>
                  )}
                </div>

                {/* Plan Features */}
                {company.subscriptionFeatures && (
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827'}}>Plan Features & Limits</h3>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                      <div style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center'}}>
                        <Icon icon={['fas', 'box']} style={{fontSize: '1.5rem', color: '#3b82f6', marginBottom: '0.5rem'}} />
                        <div style={{fontWeight: 600}}>{formatLimit(company.subscriptionFeatures.maxPackages)}</div>
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Packages</div>
                      </div>
                      <div style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center'}}>
                        <Icon icon={['fas', 'calendar-check']} style={{fontSize: '1.5rem', color: '#10b981', marginBottom: '0.5rem'}} />
                        <div style={{fontWeight: 600}}>{formatLimit(company.subscriptionFeatures.maxBookingsPerMonth)}</div>
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Monthly Bookings</div>
                      </div>
                      <div style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center'}}>
                        <Icon icon={['fas', 'image']} style={{fontSize: '1.5rem', color: '#f59e0b', marginBottom: '0.5rem'}} />
                        <div style={{fontWeight: 600}}>{formatLimit(company.subscriptionFeatures.maxPhotosPerPackage)}</div>
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Photos per Package</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription History */}
                {subscriptions.length > 0 && (
                  <div>
                    <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827'}}>Subscription History</h3>
                    <div className="customer-profile-activity-list">
                      {subscriptions.slice(0, 5).map((subscription) => (
                        <div key={subscription.id} className="customer-profile-activity-item">
                          <div className="customer-profile-activity-icon">
                            <Icon icon={['fas', subscription.status === 'active' ? 'check-circle' : subscription.status === 'cancelled' ? 'times-circle' : 'clock']} />
                          </div>
                          <div className="customer-profile-activity-content" style={{flex: 1}}>
                            <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>{subscription.planName}</p>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280'}}>
                              <span>💰 ${subscription.price}/{subscription.billingCycle}</span>
                              <span>📅 {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</span>
                              {subscription.lastPaymentDate && <span>💳 Last payment: {formatDate(subscription.lastPaymentDate)}</span>}
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: subscription.status === 'active' ? '#d1fae5' : subscription.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                              color: subscription.status === 'active' ? '#065f46' : subscription.status === 'cancelled' ? '#991b1b' : '#92400e',
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}>
                              {subscription.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {subscriptions.length === 0 && !company.subscriptionPlan && (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                    <Icon icon={['fas', 'credit-card']} size="3x" style={{opacity: 0.5, marginBottom: '1rem'}} />
                    <h3>No subscription found</h3>
                    <p>This company doesn't have any active subscription.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Package Modal */}
        {showPackageModal && (
          <div className="admin-modal-overlay" onClick={handleClosePackageModal}>
            <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{editingPackage ? 'Edit Package' : 'Create Package'}</h3>
                <button onClick={handleClosePackageModal} className="admin-modal-close">
                  <Icon icon={['fas', 'times']} />
                </button>
              </div>
              
              <form onSubmit={handlePackageSubmit} className="admin-modal-form">
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Package Title *</label>
                    <input
                      type="text"
                      value={packageFormData.title}
                      onChange={(e) => setPackageFormData({...packageFormData, title: e.target.value})}
                      required
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Price (USD) *</label>
                    <input
                      type="number"
                      value={packageFormData.price}
                      onChange={(e) => setPackageFormData({...packageFormData, price: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Child Price (USD)</label>
                    <input
                      type="number"
                      value={packageFormData.childPrice}
                      onChange={(e) => setPackageFormData({...packageFormData, childPrice: e.target.value})}
                      min="0"
                      step="0.01"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Duration (days) *</label>
                    <input
                      type="number"
                      value={packageFormData.duration}
                      onChange={(e) => setPackageFormData({...packageFormData, duration: e.target.value})}
                      required
                      min="1"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Departure Date *</label>
                    <input
                      type="date"
                      value={packageFormData.departureDate}
                      onChange={(e) => setPackageFormData({...packageFormData, departureDate: e.target.value})}
                      required
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Return Date *</label>
                    <input
                      type="date"
                      value={packageFormData.returnDate}
                      onChange={(e) => setPackageFormData({...packageFormData, returnDate: e.target.value})}
                      required
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Available Seats *</label>
                    <input
                      type="number"
                      value={packageFormData.availableSeats}
                      onChange={(e) => setPackageFormData({...packageFormData, availableSeats: e.target.value})}
                      required
                      min="0"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Total Seats *</label>
                    <input
                      type="number"
                      value={packageFormData.totalSeats}
                      onChange={(e) => setPackageFormData({...packageFormData, totalSeats: e.target.value})}
                      required
                      min="1"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Days in Makkah *</label>
                    <input
                      type="number"
                      value={packageFormData.makkahDays}
                      onChange={(e) => setPackageFormData({...packageFormData, makkahDays: e.target.value})}
                      required
                      min="1"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Days in Madina *</label>
                    <input
                      type="number"
                      value={packageFormData.madinaDays}
                      onChange={(e) => setPackageFormData({...packageFormData, madinaDays: e.target.value})}
                      required
                      min="1"
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Meal Plan</label>
                    <select
                      value={packageFormData.mealPlan}
                      onChange={(e) => setPackageFormData({...packageFormData, mealPlan: e.target.value})}
                      className="admin-form-input"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Half Board">Half Board</option>
                      <option value="Full Board">Full Board</option>
                      <option value="All Inclusive">All Inclusive</option>
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Transportation</label>
                    <select
                      value={packageFormData.transportation}
                      onChange={(e) => setPackageFormData({...packageFormData, transportation: e.target.value})}
                      className="admin-form-input"
                    >
                      <option value="Flight">Flight</option>
                      <option value="Bus">Bus</option>
                      <option value="Train">Train</option>
                      <option value="Private Car">Private Car</option>
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label>
                      {packageFormData.transportation === 'Flight' 
                        ? 'Airlines' 
                        : 'Transportation Provider'}
                    </label>
                    <input
                      type="text"
                      value={packageFormData.transportationProvider}
                      onChange={(e) => setPackageFormData({...packageFormData, transportationProvider: e.target.value})}
                      placeholder={
                        packageFormData.transportation === 'Flight' 
                          ? 'e.g., Emirates, Qatar Airways, Saudi Airlines' 
                          : `Enter ${packageFormData.transportation.toLowerCase()} provider name`
                      }
                      className="admin-form-input"
                    />
                  </div>
                  
                  <div className="admin-form-group admin-form-group-full">
                    <label>Description *</label>
                    <textarea
                      value={packageFormData.description}
                      onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                      required
                      className="admin-form-textarea"
                      rows="4"
                    />
                  </div>
                </div>
                
                <div className="admin-modal-actions">
                  <button type="button" onClick={handleClosePackageModal} className="admin-btn admin-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          /* Modal Styles */
          .admin-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 2rem;
          }

          .admin-modal {
            background: white;
            border-radius: 1rem;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }

          .admin-modal-large {
            max-width: 900px;
          }

          .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .admin-modal-header h3 {
            margin: 0;
            font-size: 1.5rem;
            color: #1f2937;
          }

          .admin-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
          }

          .admin-modal-close:hover {
            background: #f3f4f6;
            color: #374151;
          }

          .admin-modal-form {
            padding: 2rem;
          }

          .admin-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .admin-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .admin-form-group-full {
            grid-column: 1 / -1;
          }

          .admin-form-group label {
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }

          .admin-form-input {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .admin-form-input:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .admin-form-textarea {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.2s;
          }

          .admin-form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .admin-form-select {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            background: white;
            transition: border-color 0.2s;
          }

          .admin-form-select:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .admin-modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .admin-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .admin-btn-primary {
            background: #3b82f6;
            color: white;
          }

          .admin-btn-primary:hover {
            background: #2563eb;
          }

          .admin-btn-secondary {
            background: #6b7280;
            color: white;
          }

          .admin-btn-secondary:hover {
            background: #4b5563;
          }

          @media (max-width: 768px) {
            .admin-modal-overlay {
              padding: 1rem;
            }

            .admin-modal {
              max-height: 95vh;
            }

            .admin-modal-header {
              padding: 1.5rem 1.5rem 1rem 1.5rem;
            }

            .admin-modal-form {
              padding: 1.5rem;
            }

            .admin-form-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .admin-modal-actions {
              flex-direction: column;
            }
          }
        `}</style>

      </Layout>
    </ProtectedRoute>
  );
}