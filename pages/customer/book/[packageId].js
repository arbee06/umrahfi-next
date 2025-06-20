// File: pages/customer/book/[packageId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import packageService from '@/services/packageService';
import orderService from '@/services/orderService';
import { getCountries } from '@/utils/countries';
import Swal from 'sweetalert2';
import Head from 'next/head';

export default function BookPackage() {
  const router = useRouter();
  const { packageId } = router.query;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [countries] = useState(() => getCountries());
  
  const [bookingData, setBookingData] = useState({
    numberOfTravelers: 1,
    numberOfAdults: 1,
    numberOfChildren: 0,
    travelers: [{
      name: '',
      passportNumber: '',
      dateOfBirth: '',
      gender: 'male',
      isChild: false
    }],
    specialRequests: '',
    paymentMethod: 'credit_card',
    paymentReceiptFile: null,
    paymentNotes: '',
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    }
  });

  useEffect(() => {
    if (packageId) {
      fetchPackage();
    }
  }, [packageId]);

  useEffect(() => {
    // Update travelers array when numbers change
    const totalTravelers = bookingData.numberOfAdults + bookingData.numberOfChildren;
    const currentLength = bookingData.travelers.length;
    
    if (totalTravelers > currentLength) {
      // Add new travelers
      const newTravelers = [...bookingData.travelers];
      const adultsToAdd = Math.max(0, bookingData.numberOfAdults - bookingData.travelers.filter(t => !t.isChild).length);
      const childrenToAdd = Math.max(0, bookingData.numberOfChildren - bookingData.travelers.filter(t => t.isChild).length);
      
      // Add adults first
      for (let i = 0; i < adultsToAdd; i++) {
        newTravelers.push({
          name: '',
          passportNumber: '',
          dateOfBirth: '',
          gender: 'male',
          isChild: false
        });
      }
      
      // Then add children
      for (let i = 0; i < childrenToAdd; i++) {
        newTravelers.push({
          name: '',
          passportNumber: '',
          dateOfBirth: '',
          gender: 'male',
          isChild: true
        });
      }
      
      setBookingData({ ...bookingData, travelers: newTravelers, numberOfTravelers: totalTravelers });
    } else if (totalTravelers < currentLength) {
      // Remove extra travelers
      setBookingData({ 
        ...bookingData, 
        travelers: bookingData.travelers.slice(0, totalTravelers),
        numberOfTravelers: totalTravelers 
      });
    } else {
      // Update numberOfTravelers if needed
      setBookingData({ 
        ...bookingData, 
        numberOfTravelers: totalTravelers 
      });
    }
  }, [bookingData.numberOfAdults, bookingData.numberOfChildren]);

  const fetchPackage = async () => {
    try {
      const response = await packageService.getPackageById(packageId);
      setPackageData(response.package);
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTravelerChange = (index, field, value) => {
    const updatedTravelers = [...bookingData.travelers];
    updatedTravelers[index][field] = value;
    setBookingData({ ...bookingData, travelers: updatedTravelers });
  };

  const handleCreditCardChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBookingData({
        ...bookingData,
        creditCard: {
          ...bookingData.creditCard,
          [parent]: {
            ...bookingData.creditCard[parent],
            [child]: value
          }
        }
      });
    } else {
      setBookingData({
        ...bookingData,
        creditCard: {
          ...bookingData.creditCard,
          [field]: value
        }
      });
    }
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      // Validate traveler information
      return bookingData.travelers.every(traveler => 
        traveler.name && traveler.passportNumber && traveler.dateOfBirth
      );
    } else if (currentStep === 2) {
      // Validate payment information
      if (bookingData.paymentMethod === 'bank_transfer') {
        return bookingData.paymentReceiptFile !== null;
      } else if (bookingData.paymentMethod === 'credit_card') {
        const { creditCard } = bookingData;
        return creditCard.cardNumber && 
               creditCard.expiryDate && 
               creditCard.cvv && 
               creditCard.cardholderName &&
               creditCard.billingAddress.street &&
               creditCard.billingAddress.city &&
               creditCard.billingAddress.zipCode &&
               creditCard.billingAddress.country;
      }
      return true;
    }
    return false;
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/upload/payment-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setBookingData({
          ...bookingData,
          paymentReceiptFile: result.file
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload payment receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only proceed if we're on the final step and form is valid
    if (currentStep !== 2 || !isStepValid()) {
      return;
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Confirm Booking?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">You're about to book:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${packageData.title}</p>
          <p style="color: #6b7280; margin-bottom: 1rem;">for ${bookingData.numberOfTravelers} traveler(s)</p>
          <div style="background: #f0f8ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="font-weight: 600; color: #059669; margin: 0; font-size: 1.1rem;">Total: ${formatCurrency(packageData.price * bookingData.numberOfTravelers)}</p>
          </div>
          <p style="color: #6b7280; font-size: 0.9rem;">You'll be redirected to your order details after confirmation.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Book Now',
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

    setError('');
    setSubmitting(true);

    // Show loading state
    Swal.fire({
      title: 'Processing Booking...',
      html: 'Please wait while we process your booking.',
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
      const orderData = {
        packageId: packageData.id,
        numberOfTravelers: bookingData.numberOfTravelers,
        travelers: bookingData.travelers,
        specialRequests: bookingData.specialRequests,
        paymentMethod: bookingData.paymentMethod,
        paymentReceiptPath: bookingData.paymentReceiptFile?.path,
        paymentReceiptOriginalName: bookingData.paymentReceiptFile?.originalName,
        paymentNotes: bookingData.paymentNotes
      };

      const response = await orderService.createOrder(orderData);
      
      // Show success message
      await Swal.fire({
        title: 'Booking Confirmed!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">Your booking has been successfully created!</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Order Number:</p>
            <p style="font-weight: 600; color: #1f2937; font-family: monospace; font-size: 1.1rem;">${response.order.orderNumber}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'View Order Details',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
      
      router.push(`/customer/orders/${response.order.id}`);
    } catch (err) {
      Swal.close();
      setError(err.error || 'Failed to create booking');
      
      // Show error message
      await Swal.fire({
        title: 'Booking Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">${err.error || 'Failed to create booking'}</p>
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
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="customer-book-container">
          <div className="customer-book-loading-state">
            <div className="customer-book-loading-spinner"></div>
            <span>Loading package details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!packageData) {
    return (
      <Layout>
        <div className="customer-book-container">
          <div className="customer-book-error-state">
            <div className="customer-book-error-icon">⚠️</div>
            <h3>Package Not Found</h3>
            <p>The package you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => router.push('/packages')}
              className="customer-book-btn-primary"
            >
              Browse Packages
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalAmount = (packageData.price * bookingData.numberOfAdults) + (packageData.childPrice * bookingData.numberOfChildren);

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Head>
        <title>Book Package - {packageData?.title || 'Umrah Package'}</title>
        <link rel="stylesheet" href="/styles/customer-booking.css" />
      </Head>
      <Layout>
        <div className="customer-book-container">
          {/* Header */}
          <div className="customer-book-header">
            <div className="customer-book-header-content">
              <div className="customer-book-breadcrumb">
                <button 
                  onClick={() => router.back()}
                  className="customer-book-back-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <span className="customer-book-breadcrumb-separator">•</span>
                <span className="customer-book-breadcrumb-text">Book Package</span>
              </div>
              
              <div className="customer-book-header-text">
                <h1 className="customer-book-header-title">{packageData.title}</h1>
                <p className="customer-book-header-subtitle">Complete your booking details below</p>
              </div>
            </div>
          </div>

          <div className="customer-book-content">
            {/* Package Summary Card */}
            <div className="customer-book-package-summary">
              <div className="customer-book-summary-header">
                <div className="customer-book-summary-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="customer-book-summary-title">Package Summary</h2>
              </div>
              
              <div className="customer-book-summary-content">
                <div className="customer-book-summary-grid">
                  <div className="customer-book-summary-item">
                    <div className="customer-book-summary-label">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Price per person
                    </div>
                    <div className="customer-book-summary-value price">
                      {formatCurrency(packageData.price)}
                    </div>
                  </div>
                  
                  <div className="customer-book-summary-item">
                    <div className="customer-book-summary-label">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Departure Date
                    </div>
                    <div className="customer-book-summary-value">
                      {formatDate(packageData.departureDate)}
                    </div>
                  </div>
                  
                  <div className="customer-book-summary-item">
                    <div className="customer-book-summary-label">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Available Seats
                    </div>
                    <div className="customer-book-summary-value">
                      {packageData.availableSeats} remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="customer-book-form">
              <div className="customer-book-form-card">
                <div className="customer-book-form-header">
                  <div className="customer-book-form-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="customer-book-form-title">Booking Details</h2>
                </div>

                {/* Step Indicator */}
                <div className="customer-book-steps">
                  <div className={`customer-book-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    <div className="customer-book-step-number">
                      {currentStep > 1 ? (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : '1'}
                    </div>
                    <div className="customer-book-step-label">Travelers</div>
                  </div>
                  <div className="customer-book-step-divider"></div>
                  <div className={`customer-book-step ${currentStep >= 2 ? 'active' : ''}`}>
                    <div className="customer-book-step-number">2</div>
                    <div className="customer-book-step-label">Payment</div>
                  </div>
                </div>
                
                {error && (
                  <div className="customer-book-error-alert">
                    <div className="customer-book-error-alert-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="customer-book-form-content">
                  {currentStep === 1 && (
                    <div className="customer-book-step-content">
                      {/* Enhanced Number of Travelers Section */}
                      <div className="customer-book-travelers-selector-wrapper">
                        <div className="customer-book-travelers-selector-header">
                          <div className="customer-book-travelers-selector-info">
                            <h3 className="customer-book-travelers-selector-title">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Number of Travelers
                            </h3>
                            <p className="customer-book-travelers-selector-subtitle">
                              Select how many adults and children will be traveling
                            </p>
                          </div>
                        </div>
                        
                        {/* Adults Selector */}
                        <div className="customer-book-travelers-type-section">
                          <div className="customer-book-travelers-type-label">
                            <span className="customer-book-travelers-type-title">Adults</span>
                            <span className="customer-book-travelers-type-price">${packageData.price} per adult</span>
                          </div>
                          <div className="customer-book-travelers-selector">
                            <button
                              type="button"
                              className="customer-book-travelers-btn"
                              onClick={() => setBookingData({
                                ...bookingData,
                                numberOfAdults: Math.max(1, bookingData.numberOfAdults - 1)
                              })}
                              disabled={bookingData.numberOfAdults <= 1}
                            >
                              <span>−</span>
                            </button>
                            
                            <div className="customer-book-travelers-count-wrapper">
                              <div className="customer-book-travelers-count">
                                {bookingData.numberOfAdults}
                              </div>
                              <div className="customer-book-travelers-count-label">
                                {bookingData.numberOfAdults === 1 ? 'Adult' : 'Adults'}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              className="customer-book-travelers-btn"
                              onClick={() => setBookingData({
                                ...bookingData,
                                numberOfAdults: Math.min(packageData.availableSeats - bookingData.numberOfChildren, bookingData.numberOfAdults + 1)
                              })}
                              disabled={bookingData.numberOfAdults + bookingData.numberOfChildren >= packageData.availableSeats}
                            >
                              <span>+</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Children Selector */}
                        <div className="customer-book-travelers-type-section">
                          <div className="customer-book-travelers-type-label">
                            <span className="customer-book-travelers-type-title">Children</span>
                            <span className="customer-book-travelers-type-price">${packageData.childPrice} per child</span>
                          </div>
                          <div className="customer-book-travelers-selector">
                            <button
                              type="button"
                              className="customer-book-travelers-btn"
                              onClick={() => setBookingData({
                                ...bookingData,
                                numberOfChildren: Math.max(0, bookingData.numberOfChildren - 1)
                              })}
                              disabled={bookingData.numberOfChildren <= 0}
                            >
                              <span>−</span>
                            </button>
                            
                            <div className="customer-book-travelers-count-wrapper">
                              <div className="customer-book-travelers-count">
                                {bookingData.numberOfChildren}
                              </div>
                              <div className="customer-book-travelers-count-label">
                                {bookingData.numberOfChildren === 1 ? 'Child' : 'Children'}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              className="customer-book-travelers-btn"
                              onClick={() => setBookingData({
                                ...bookingData,
                                numberOfChildren: Math.min(packageData.availableSeats - bookingData.numberOfAdults, bookingData.numberOfChildren + 1)
                              })}
                              disabled={bookingData.numberOfAdults + bookingData.numberOfChildren >= packageData.availableSeats}
                            >
                              <span>+</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="customer-book-travelers-availability">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="customer-book-travelers-availability-text">
                            {packageData.availableSeats} seats available for this package
                          </span>
                        </div>
                      </div>

                      {/* Traveler Information */}
                      <div className="customer-book-travelers-section">
                        <h3 className="customer-book-section-title">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Traveler Information
                        </h3>
                        
                        <div className="customer-book-travelers-grid">
                          {bookingData.travelers.map((traveler, index) => (
                            <div key={index} className="customer-book-traveler-card">
                              <div className="customer-book-traveler-header">
                                <div className="customer-book-traveler-number">
                                  <span>{index + 1}</span>
                                </div>
                                <h4 className="customer-book-traveler-title">
                                  Traveler {index + 1} - {traveler.isChild ? 'Child' : 'Adult'}
                                </h4>
                              </div>
                              
                              <div className="customer-book-traveler-form">
                                <div className="customer-book-form-row">
                                  <div className="customer-book-form-group">
                                    <label className="customer-book-form-label">Full Name</label>
                                    <input
                                      type="text"
                                      className="customer-book-form-input"
                                      value={traveler.name}
                                      onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                                      placeholder="Enter full name as per passport"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="customer-book-form-group">
                                    <label className="customer-book-form-label">Gender</label>
                                    <select
                                      className="customer-book-form-select"
                                      value={traveler.gender}
                                      onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                                      required
                                    >
                                      <option value="male">Male</option>
                                      <option value="female">Female</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="customer-book-form-row">
                                  <div className="customer-book-form-group">
                                    <label className="customer-book-form-label">Passport Number</label>
                                    <input
                                      type="text"
                                      className="customer-book-form-input"
                                      value={traveler.passportNumber}
                                      onChange={(e) => handleTravelerChange(index, 'passportNumber', e.target.value)}
                                      placeholder="Enter passport number"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="customer-book-form-group">
                                    <label className="customer-book-form-label">Date of Birth</label>
                                    <input
                                      type="date"
                                      className="customer-book-form-input"
                                      value={traveler.dateOfBirth}
                                      onChange={(e) => handleTravelerChange(index, 'dateOfBirth', e.target.value)}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div className="customer-book-form-group">
                        <label className="customer-book-form-label">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Special Requests (Optional)
                        </label>
                        <textarea
                          className="customer-book-form-textarea"
                          rows="4"
                          value={bookingData.specialRequests}
                          onChange={(e) => setBookingData({
                            ...bookingData,
                            specialRequests: e.target.value
                          })}
                          placeholder="Any special requirements, dietary restrictions, or accessibility needs..."
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="customer-book-step-content">
                      {/* Payment Method Selection */}
                      <div className="customer-book-form-group">
                        <label className="customer-book-form-label">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Payment Method
                        </label>
                        <div className="customer-book-payment-options">
                          <div className="customer-book-payment-option">
                            <input
                              type="radio"
                              id="credit_card"
                              name="paymentMethod"
                              value="credit_card"
                              checked={bookingData.paymentMethod === 'credit_card'}
                              onChange={(e) => setBookingData({
                                ...bookingData,
                                paymentMethod: e.target.value,
                                paymentReceiptFile: null
                              })}
                            />
                            <label htmlFor="credit_card" className="customer-book-payment-label">
                              <div className="customer-book-payment-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                              <div className="customer-book-payment-info">
                                <div className="customer-book-payment-title">Credit Card</div>
                                <div className="customer-book-payment-desc">Pay with your credit or debit card</div>
                              </div>
                            </label>
                          </div>
                          
                          <div className="customer-book-payment-option">
                            <input
                              type="radio"
                              id="bank_transfer"
                              name="paymentMethod"
                              value="bank_transfer"
                              checked={bookingData.paymentMethod === 'bank_transfer'}
                              onChange={(e) => setBookingData({
                                ...bookingData,
                                paymentMethod: e.target.value
                              })}
                            />
                            <label htmlFor="bank_transfer" className="customer-book-payment-label">
                              <div className="customer-book-payment-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                </svg>
                              </div>
                              <div className="customer-book-payment-info">
                                <div className="customer-book-payment-title">Bank Transfer</div>
                                <div className="customer-book-payment-desc">Transfer money directly to our bank account</div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Credit Card Form */}
                      {bookingData.paymentMethod === 'credit_card' && (
                        <div className="customer-book-credit-card-section">
                          <div className="customer-book-credit-card-header">
                            <h4 className="customer-book-credit-card-title">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-2A11.95 11.95 0 014 12H0l2-2m-2 2l2 2m18-2a11.95 11.95 0 01-11.5 10z" />
                              </svg>
                              Credit Card Information
                            </h4>
                            <div className="customer-book-secure-badge">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Secured with SSL encryption</span>
                            </div>
                          </div>

                          <div className="customer-book-credit-card-form">
                            {/* Card Number */}
                            <div className="customer-book-form-group">
                              <label className="customer-book-form-label">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Card Number *
                              </label>
                              <input
                                type="text"
                                className="customer-book-form-input customer-book-card-input"
                                value={bookingData.creditCard.cardNumber}
                                onChange={(e) => handleCreditCardChange('cardNumber', formatCardNumber(e.target.value))}
                                placeholder="1234 5678 9012 3456"
                                maxLength="19"
                                required
                              />
                            </div>

                            {/* Cardholder Name */}
                            <div className="customer-book-form-group">
                              <label className="customer-book-form-label">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Cardholder Name *
                              </label>
                              <input
                                type="text"
                                className="customer-book-form-input"
                                value={bookingData.creditCard.cardholderName}
                                onChange={(e) => handleCreditCardChange('cardholderName', e.target.value.toUpperCase())}
                                placeholder="JOHN DOE"
                                required
                              />
                            </div>

                            {/* Expiry Date and CVV */}
                            <div className="customer-book-form-row">
                              <div className="customer-book-form-group">
                                <label className="customer-book-form-label">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Expiry Date *
                                </label>
                                <input
                                  type="text"
                                  className="customer-book-form-input"
                                  value={bookingData.creditCard.expiryDate}
                                  onChange={(e) => handleCreditCardChange('expiryDate', formatExpiryDate(e.target.value))}
                                  placeholder="MM/YY"
                                  maxLength="5"
                                  required
                                />
                              </div>
                              
                              <div className="customer-book-form-group">
                                <label className="customer-book-form-label">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-2A11.95 11.95 0 014 12H0l2-2m-2 2l2 2m18-2a11.95 11.95 0 01-11.5 10z" />
                                  </svg>
                                  CVV *
                                </label>
                                <input
                                  type="text"
                                  className="customer-book-form-input"
                                  value={bookingData.creditCard.cvv}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 4) {
                                      handleCreditCardChange('cvv', value);
                                    }
                                  }}
                                  placeholder="123"
                                  maxLength="4"
                                  required
                                />
                              </div>
                            </div>

                            {/* Billing Address */}
                            <div className="customer-book-billing-section">
                              <h5 className="customer-book-billing-title">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Billing Address
                              </h5>
                              
                              <div className="customer-book-form-group">
                                <label className="customer-book-form-label">Street Address *</label>
                                <input
                                  type="text"
                                  className="customer-book-form-input"
                                  value={bookingData.creditCard.billingAddress.street}
                                  onChange={(e) => handleCreditCardChange('billingAddress.street', e.target.value)}
                                  placeholder="123 Main Street"
                                  required
                                />
                              </div>

                              <div className="customer-book-form-row">
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">City *</label>
                                  <input
                                    type="text"
                                    className="customer-book-form-input"
                                    value={bookingData.creditCard.billingAddress.city}
                                    onChange={(e) => handleCreditCardChange('billingAddress.city', e.target.value)}
                                    placeholder="New York"
                                    required
                                  />
                                </div>
                                
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">State/Province</label>
                                  <input
                                    type="text"
                                    className="customer-book-form-input"
                                    value={bookingData.creditCard.billingAddress.state}
                                    onChange={(e) => handleCreditCardChange('billingAddress.state', e.target.value)}
                                    placeholder="NY"
                                  />
                                </div>
                              </div>

                              <div className="customer-book-form-row">
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">ZIP/Postal Code *</label>
                                  <input
                                    type="text"
                                    className="customer-book-form-input"
                                    value={bookingData.creditCard.billingAddress.zipCode}
                                    onChange={(e) => handleCreditCardChange('billingAddress.zipCode', e.target.value)}
                                    placeholder="10001"
                                    required
                                  />
                                </div>
                                
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">Country *</label>
                                  <select
                                    className="customer-book-form-select"
                                    value={bookingData.creditCard.billingAddress.country}
                                    onChange={(e) => handleCreditCardChange('billingAddress.country', e.target.value)}
                                    required
                                  >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                      <option key={country.code} value={country.code}>
                                        {country.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bank Transfer Receipt Upload */}
                      {bookingData.paymentMethod === 'bank_transfer' && (
                        <div className="customer-book-bank-transfer-section">
                          <div className="customer-book-bank-info">
                            <h4 className="customer-book-bank-info-title">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Bank Transfer Instructions
                            </h4>
                            <div className="customer-book-bank-details">
                              <p>Please transfer the amount of <strong>{formatCurrency(totalAmount)}</strong> to the following bank account:</p>
                              <div className="customer-book-bank-account">
                                <div className="customer-book-bank-field">
                                  <span className="customer-book-bank-label">Bank Name:</span>
                                  <span className="customer-book-bank-value">Chase Bank</span>
                                </div>
                                <div className="customer-book-bank-field">
                                  <span className="customer-book-bank-label">Account Number:</span>
                                  <span className="customer-book-bank-value">1234567890</span>
                                </div>
                                <div className="customer-book-bank-field">
                                  <span className="customer-book-bank-label">Account Holder:</span>
                                  <span className="customer-book-bank-value">Umrah Travel Company</span>
                                </div>
                                <div className="customer-book-bank-field">
                                  <span className="customer-book-bank-label">Routing Number:</span>
                                  <span className="customer-book-bank-value">021000021</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="customer-book-form-group">
                            <label className="customer-book-form-label">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Upload Payment Receipt *
                            </label>
                            <div className="customer-book-file-upload">
                              <input
                                type="file"
                                id="paymentReceipt"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleFileUpload(file);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor="paymentReceipt" className="customer-book-file-upload-label">
                                {uploading ? (
                                  <div className="customer-book-file-upload-loading">
                                    <div className="customer-book-btn-spinner"></div>
                                    <span>Uploading...</span>
                                  </div>
                                ) : bookingData.paymentReceiptFile ? (
                                  <div className="customer-book-file-upload-success">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{bookingData.paymentReceiptFile.originalName}</span>
                                  </div>
                                ) : (
                                  <div className="customer-book-file-upload-placeholder">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Click to upload receipt image</span>
                                    <small>PNG, JPG, JPEG up to 5MB</small>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>

                          <div className="customer-book-form-group">
                            <label className="customer-book-form-label">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              Payment Notes (Optional)
                            </label>
                            <textarea
                              className="customer-book-form-textarea"
                              rows="3"
                              value={bookingData.paymentNotes}
                              onChange={(e) => setBookingData({
                                ...bookingData,
                                paymentNotes: e.target.value
                              })}
                              placeholder="Any additional information about your payment..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation and Total */}
              <div className="customer-book-total-section">
                <div className="customer-book-total-card">
                  <div className="customer-book-total-breakdown">
                    {bookingData.numberOfAdults > 0 && (
                      <div className="customer-book-breakdown-item">
                        <span>{bookingData.numberOfAdults} Adult{bookingData.numberOfAdults > 1 ? 's' : ''} × {formatCurrency(packageData.price)}</span>
                        <span>{formatCurrency(packageData.price * bookingData.numberOfAdults)}</span>
                      </div>
                    )}
                    {bookingData.numberOfChildren > 0 && (
                      <div className="customer-book-breakdown-item">
                        <span>{bookingData.numberOfChildren} Child{bookingData.numberOfChildren > 1 ? 'ren' : ''} × {formatCurrency(packageData.childPrice)}</span>
                        <span>{formatCurrency(packageData.childPrice * bookingData.numberOfChildren)}</span>
                      </div>
                    )}
                    <div className="customer-book-breakdown-divider"></div>
                    <div className="customer-book-breakdown-total">
                      <span>Total Amount</span>
                      <span className="customer-book-total-amount">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="customer-book-actions">
                    {currentStep === 1 ? (
                      <>
                        <button 
                          type="button" 
                          className="customer-book-btn-secondary"
                          onClick={() => router.back()}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="customer-book-btn-primary"
                          onClick={nextStep}
                          disabled={!isStepValid()}
                        >
                          Continue to Payment
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          className="customer-book-btn-secondary"
                          onClick={prevStep}
                          disabled={submitting}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Back to Travelers</span>
                        </button>
                        <button 
                          type="submit" 
                          className="customer-book-btn-primary"
                          disabled={submitting || !isStepValid()}
                        >
                          {submitting ? (
                            <>
                              <div className="customer-book-btn-spinner"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirm Booking
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}