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
import StripePaymentForm from '@/components/StripePaymentForm';

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
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    numberOfTravelers: 1,
    numberOfAdults: 1,
    numberOfChildren: 0,
    travelers: [{
      name: '',
      passportNumber: '',
      dateOfBirth: '',
      gender: 'male',
      isChild: false,
      passportData: null,
      uploadingPassport: false,
      passportError: null,
      visaData: null,
      uploadingVisa: false,
      visaError: null,
      needsPassportAssistance: false,
      needsVisaAssistance: false
    }],
    specialRequests: '',
    paymentMethod: 'stripe',
    paymentReceiptFile: null,
    paymentNotes: '',
    stripeToken: null,
    stripePaymentMethod: null
  });

  useEffect(() => {
    if (packageId) {
      fetchPackage();
    }
  }, [packageId]);

  // Update payment method when package data is loaded
  useEffect(() => {
    if (packageData?.company && !completingOrderId) {
      const defaultMethod = getDefaultPaymentMethod();
      if (defaultMethod !== bookingData.paymentMethod) {
        setBookingData(prev => ({
          ...prev,
          paymentMethod: defaultMethod
        }));
      }
    }
  }, [packageData]);

  useEffect(() => {
    const { completeOrder } = router.query;
    if (completeOrder && router.isReady) {
      setCompletingOrderId(completeOrder);
      fetchExistingOrder(completeOrder);
    }
  }, [router.query, router.isReady]);

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
          isChild: false,
          passportData: null,
          uploadingPassport: false,
          passportError: null,
          visaData: null,
          uploadingVisa: false,
          visaError: null,
          needsPassportAssistance: false,
          needsVisaAssistance: false
        });
      }
      
      // Then add children
      for (let i = 0; i < childrenToAdd; i++) {
        newTravelers.push({
          name: '',
          passportNumber: '',
          dateOfBirth: '',
          gender: 'male',
          isChild: true,
          passportData: null,
          uploadingPassport: false,
          passportError: null,
          visaData: null,
          uploadingVisa: false,
          visaError: null,
          needsPassportAssistance: false,
          needsVisaAssistance: false
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

  // Helper function to get available payment methods based on company preferences
  const getAvailablePaymentMethods = () => {
    if (!packageData?.company) return [];
    
    const company = packageData.company;
    const availableMethods = [];
    
    // Check preferred payment methods (for Stripe)
    const preferredMethods = company.preferredPaymentMethods || [];
    if (preferredMethods.includes('stripe')) {
      availableMethods.push('stripe');
    }
    
    // Check individual flags
    if (company.acceptCashPayments !== false) {
      availableMethods.push('cash');
    }
    
    if (company.acceptBankTransfers !== false) {
      availableMethods.push('bank_transfer');
    }
    
    return availableMethods;
  };

  // Helper function to get the first available payment method as default
  const getDefaultPaymentMethod = () => {
    const availableMethods = getAvailablePaymentMethods();
    return availableMethods.length > 0 ? availableMethods[0] : 'cash';
  };

  const fetchExistingOrder = async (orderId) => {
    try {
      const response = await orderService.getOrderById(orderId);
      const order = response.order;
      setExistingOrder(order);
      
      // Pre-fill form with existing order data
      setBookingData({
        numberOfTravelers: order.numberOfAdults + order.numberOfChildren,
        numberOfAdults: order.numberOfAdults,
        numberOfChildren: order.numberOfChildren,
        travelers: order.travelers || [],
        specialRequests: order.specialRequests || '',
        paymentMethod: 'stripe', // Force Stripe for completing payment
        paymentReceiptFile: null,
        paymentNotes: '',
        stripeToken: null,
        stripePaymentMethod: null
      });
      
      // Skip to payment step
      setCurrentStep(2);
    } catch (error) {
      console.error('Error fetching existing order:', error);
      Swal.fire({
        title: 'Error',
        text: 'Could not load order details. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleTravelerChange = (index, field, value) => {
    const updatedTravelers = [...bookingData.travelers];
    
    // Check for duplicate passport number when manually entering
    if (field === 'passportNumber' && value) {
      const isDuplicate = bookingData.travelers.some((traveler, travelerIndex) => {
        if (travelerIndex === index) return false; // Skip current traveler
        return traveler.passportNumber && 
               traveler.passportNumber.toLowerCase() === value.toLowerCase();
      });
      
      if (isDuplicate) {
        // Show inline error
        updatedTravelers[index].passportError = 'This passport number is already used for another traveler';
        updatedTravelers[index][field] = value;
        setBookingData({ ...bookingData, travelers: updatedTravelers });
        
        // Show alert after a short delay to allow the UI to update
        setTimeout(() => {
          Swal.fire({
            title: 'Duplicate Passport Number',
            html: `
              <div style="text-align: center; margin: 1rem 0;">
                <p style="color: #dc2626; font-weight: 600;">This passport number is already assigned to another traveler!</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem;">Each traveler must have a unique passport number.</p>
              </div>
            `,
            icon: 'warning',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false,
            timer: 3000,
            timerProgressBar: true
          });
        }, 100);
        
        return;
      } else {
        // Clear any previous passport error
        updatedTravelers[index].passportError = null;
      }
    }
    
    updatedTravelers[index][field] = value;
    setBookingData({ ...bookingData, travelers: updatedTravelers });
  };

  const handlePassportUpload = async (index, file) => {
    if (!file) return;

    const updatedTravelers = [...bookingData.travelers];
    updatedTravelers[index].uploadingPassport = true;
    updatedTravelers[index].passportError = null;
    setBookingData({ ...bookingData, travelers: updatedTravelers });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/passport/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const passportData = result.passport_data;
        
        // Check for duplicate passport across all travelers
        const isDuplicate = bookingData.travelers.some((traveler, travelerIndex) => {
          if (travelerIndex === index) return false; // Skip current traveler
          
          // Check if passport number matches
          if (traveler.passportNumber && passportData.passport_number && 
              traveler.passportNumber.toLowerCase() === passportData.passport_number.toLowerCase()) {
            return true;
          }
          
          // Check if passport data exists and matches
          if (traveler.passportData && traveler.passportData.passport_number && 
              traveler.passportData.passport_number.toLowerCase() === passportData.passport_number.toLowerCase()) {
            return true;
          }
          
          // Check by file hash if available
          if (traveler.passportData && traveler.passportData.file_hash && 
              passportData.file_hash && traveler.passportData.file_hash === passportData.file_hash) {
            return true;
          }
          
          return false;
        });
        
        if (isDuplicate) {
          updatedTravelers[index].uploadingPassport = false;
          updatedTravelers[index].passportError = 'This passport has already been uploaded for another traveler';
          setBookingData({ ...bookingData, travelers: updatedTravelers });
          
          // Show error alert
          await Swal.fire({
            title: 'Duplicate Passport Detected',
            html: `
              <div style="text-align: center; margin: 1rem 0;">
                <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <svg style="width: 3rem; height: 3rem; color: #dc2626; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">This passport has already been uploaded for another traveler!</p>
                  <p style="color: #991b1b; font-size: 0.9rem;">Each traveler must have their own unique passport. Please upload a different passport for this traveler.</p>
                </div>
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
                  <p style="color: #0369a1; font-size: 0.9rem; margin: 0;">
                    <strong>Passport Number:</strong> ${passportData.passport_number || 'N/A'}<br>
                    <strong>Name:</strong> ${passportData.given_names || ''} ${passportData.surname || ''}
                  </p>
                </div>
              </div>
            `,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Understood',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false
          });
          
          return;
        }
        
        // Validate that essential passport data is present
        const requiredFields = {
          passport_number: 'Passport Number',
          surname: 'Surname',
          given_names: 'Given Names',
          date_of_birth: 'Date of Birth',
          nationality: 'Nationality'
        };
        
        const missingFields = [];
        const extractedData = {};
        
        // Check for missing required fields
        for (const [field, label] of Object.entries(requiredFields)) {
          if (!passportData[field] || passportData[field] === 'null' || passportData[field] === '') {
            missingFields.push(label);
          } else {
            extractedData[field] = passportData[field];
          }
        }
        
        // Check if this might not be a passport image
        const criticalFieldsMissing = !passportData.passport_number && !passportData.surname && !passportData.given_names;
        
        if (criticalFieldsMissing) {
          // This is likely not a passport image
          updatedTravelers[index].uploadingPassport = false;
          updatedTravelers[index].passportError = 'Invalid image - please upload a clear passport photo';
          setBookingData({ ...bookingData, travelers: updatedTravelers });
          
          await Swal.fire({
            title: 'Invalid Document',
            html: `
              <div style="text-align: center; margin: 1rem 0;">
                <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <svg style="width: 4rem; height: 4rem; color: #dc2626; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">This doesn't appear to be a passport image</p>
                  <p style="color: #991b1b; font-size: 0.9rem;">Our AI couldn't detect any passport information in this image.</p>
                </div>
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
                  <p style="color: #0369a1; font-size: 0.9rem; margin: 0 0 1rem 0;"><strong>Tips for successful passport scanning:</strong></p>
                  <ul style="text-align: left; color: #0369a1; font-size: 0.875rem; margin: 0; padding-left: 1.5rem;">
                    <li>Upload a clear photo of the passport's data page</li>
                    <li>Ensure the entire passport page is visible</li>
                    <li>Avoid blurry or dark images</li>
                    <li>Make sure text is readable and not cut off</li>
                    <li>Use the page with photo and personal details</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Try Again',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false
          });
          
          return;
        }
        
        // If some fields are missing but it's likely a passport
        if (missingFields.length > 0) {
          // Still update with available data
          updatedTravelers[index].passportData = passportData;
          updatedTravelers[index].name = `${passportData.given_names || ''} ${passportData.surname || ''}`.trim() || updatedTravelers[index].name;
          updatedTravelers[index].passportNumber = passportData.passport_number || updatedTravelers[index].passportNumber;
          
          // Continue with date parsing and other updates...
          // (Moving the existing date parsing code here)
        } else {
          // All required fields are present
          updatedTravelers[index].passportData = passportData;
          updatedTravelers[index].name = `${passportData.given_names || ''} ${passportData.surname || ''}`.trim() || updatedTravelers[index].name;
          updatedTravelers[index].passportNumber = passportData.passport_number || updatedTravelers[index].passportNumber;
        }
        
        // Parse and format date of birth
        if (passportData.date_of_birth) {
          console.log('Original DOB:', passportData.date_of_birth);
          
          // Try different date parsing approaches
          let parsedDate = null;
          
          // First try splitting by / or -
          const dobParts = passportData.date_of_birth.split(/[-\/]/);
          if (dobParts.length === 3) {
            // Check if it's DD/MM/YYYY or DD-MM-YYYY format
            let day, month, year;
            
            // If the first part is > 12, it's likely DD/MM/YYYY
            if (parseInt(dobParts[0]) > 12 || parseInt(dobParts[1]) <= 12) {
              day = dobParts[0].padStart(2, '0');
              month = dobParts[1].padStart(2, '0');
              year = dobParts[2];
            } else {
              // Otherwise might be MM/DD/YYYY
              month = dobParts[0].padStart(2, '0');
              day = dobParts[1].padStart(2, '0');
              year = dobParts[2];
            }
            
            // Handle 2-digit years
            if (year.length === 2) {
              year = parseInt(year) > 50 ? '19' + year : '20' + year;
            }
            
            parsedDate = `${year}-${month}-${day}`;
            
            // Validate the parsed date
            const testDate = new Date(parsedDate);
            if (isNaN(testDate.getTime())) {
              parsedDate = null;
            }
          }
          
          // If first approach failed, try parsing as a Date object
          if (!parsedDate) {
            try {
              // Try various date formats
              const dateFormats = [
                passportData.date_of_birth, // Original format
                passportData.date_of_birth.replace(/\//g, '-'), // Replace / with -
                passportData.date_of_birth.split(/[-\/]/).reverse().join('-') // Try reversing
              ];
              
              for (const format of dateFormats) {
                const date = new Date(format);
                if (!isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');
                  parsedDate = `${year}-${month}-${day}`;
                  break;
                }
              }
            } catch (e) {
              console.error('Date parsing error:', e);
            }
          }
          
          // If we successfully parsed the date, update it
          if (parsedDate) {
            console.log('Parsed DOB:', parsedDate);
            updatedTravelers[index].dateOfBirth = parsedDate;
          } else {
            console.error('Failed to parse date:', passportData.date_of_birth);
          }
        }
        
        // Update gender if available
        if (passportData.sex) {
          updatedTravelers[index].gender = passportData.sex.toLowerCase() === 'm' ? 'male' : 'female';
        }
        
        updatedTravelers[index].uploadingPassport = false;
        setBookingData({ ...bookingData, travelers: updatedTravelers });
        
        // Show success message with warning about missing fields if any
        if (missingFields.length > 0) {
          await Swal.fire({
            title: 'Passport Data Partially Extracted',
            html: `
              <div style="text-align: left; margin: 1rem 0;">
                <div style="background: #fef8e1; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border: 1px solid #fbbf24;">
                  <p style="color: #92400e; font-weight: 600; margin-bottom: 0.5rem;">
                    <svg style="width: 1.25rem; height: 1.25rem; display: inline-block; vertical-align: -3px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Some information could not be extracted
                  </p>
                  <p style="color: #92400e; font-size: 0.875rem; margin: 0;">Missing fields: ${missingFields.join(', ')}</p>
                </div>
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <p style="color: #059669; font-weight: 600; margin-bottom: 0.5rem;">Extracted Information:</p>
                  ${updatedTravelers[index].name ? `<p style="margin: 0.25rem 0;"><strong>Name:</strong> ${updatedTravelers[index].name}</p>` : ''}
                  ${updatedTravelers[index].passportNumber ? `<p style="margin: 0.25rem 0;"><strong>Passport:</strong> ${updatedTravelers[index].passportNumber}</p>` : ''}
                  ${updatedTravelers[index].dateOfBirth ? `<p style="margin: 0.25rem 0;"><strong>DOB:</strong> ${updatedTravelers[index].dateOfBirth}</p>` : ''}
                  ${passportData.nationality ? `<p style="margin: 0.25rem 0;"><strong>Nationality:</strong> ${passportData.nationality}</p>` : ''}
                </div>
                <p style="color: #6b7280; font-size: 0.875rem; text-align: center;">Please fill in any missing information manually.</p>
              </div>
            `,
            icon: 'warning',
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'OK, I\'ll Complete It',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false
          });
        } else {
          // All fields extracted successfully
          await Swal.fire({
            title: 'Passport Data Extracted!',
            html: `
              <div style="text-align: left; margin: 1rem 0;">
                <div style="background: #d1fae5; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; text-align: center;">
                  <svg style="width: 3rem; height: 3rem; color: #059669; margin-bottom: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style="color: #065f46; font-weight: 600; margin: 0;">All passport information extracted successfully!</p>
                </div>
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
                  <p style="margin: 0.25rem 0;"><strong>Name:</strong> ${updatedTravelers[index].name}</p>
                  <p style="margin: 0.25rem 0;"><strong>Passport:</strong> ${updatedTravelers[index].passportNumber}</p>
                  <p style="margin: 0.25rem 0;"><strong>DOB:</strong> ${updatedTravelers[index].dateOfBirth || passportData.date_of_birth}</p>
                  <p style="margin: 0.25rem 0;"><strong>Nationality:</strong> ${passportData.nationality}</p>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#059669',
            confirmButtonText: 'Continue',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false
          });
        }
      } else {
        throw new Error(result.error || 'Failed to extract passport data');
      }
    } catch (err) {
      updatedTravelers[index].uploadingPassport = false;
      updatedTravelers[index].passportError = err.message || 'Failed to process passport image';
      setBookingData({ ...bookingData, travelers: updatedTravelers });
      
      // Show detailed error message
      await Swal.fire({
        title: 'Processing Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <svg style="width: 3rem; height: 3rem; color: #dc2626; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">Failed to process passport image</p>
              <p style="color: #991b1b; font-size: 0.9rem;">${err.message || 'Please try again with a clearer image'}</p>
            </div>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
              <p style="color: #0369a1; font-size: 0.9rem; margin: 0 0 0.5rem 0;"><strong>Common issues:</strong></p>
              <ul style="text-align: left; color: #0369a1; font-size: 0.875rem; margin: 0; padding-left: 1.5rem;">
                <li>Image is too blurry or dark</li>
                <li>File size is too large (max 16MB)</li>
                <li>Passport page is partially hidden</li>
                <li>Wrong page of passport (use data page)</li>
                <li>Network connection issues</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'Enter Manually',
        cancelButtonColor: '#6b7280',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm',
          cancelButton: 'custom-swal-cancel'
        },
        buttonsStyling: false
      }).then((result) => {
        if (!result.isConfirmed) {
          // User chose to enter manually - focus on the passport number field
          const passportInput = document.querySelector(`#passport-input-${index}`);
          if (passportInput) {
            passportInput.focus();
          }
        }
      });
    }
  };

  const handleVisaUpload = async (index, file) => {
    if (!file) return;

    const updatedTravelers = [...bookingData.travelers];
    updatedTravelers[index].uploadingVisa = true;
    updatedTravelers[index].visaError = null;
    setBookingData({ ...bookingData, travelers: updatedTravelers });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/visa/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store simple file information
        const visaFileInfo = {
          filename: result.file_info.filename,
          size: result.file_info.size,
          type: result.file_info.type,
          file_hash: result.file_info.file_hash,
          image_path: result.file_info.image_path,
          uploaded_at: new Date().toISOString()
        };
        
        // Check for duplicate visa by file hash
        const isDuplicate = bookingData.travelers.some((traveler, travelerIndex) => {
          if (travelerIndex === index) return false;
          return traveler.visaFileInfo && traveler.visaFileInfo.file_hash === visaFileInfo.file_hash;
        });
        
        if (isDuplicate) {
          updatedTravelers[index].uploadingVisa = false;
          updatedTravelers[index].visaError = 'This visa document has already been uploaded for another traveler';
          setBookingData({ ...bookingData, travelers: updatedTravelers });
          
          await Swal.fire({
            title: 'Duplicate Visa Document',
            html: `
              <div style="text-align: center; margin: 1rem 0;">
                <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <svg style="width: 3rem; height: 3rem; color: #dc2626; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">This visa document has already been uploaded for another traveler!</p>
                  <p style="color: #991b1b; font-size: 0.9rem;">Each traveler must have their own unique visa document. Please upload a different document for this traveler.</p>
                </div>
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
                  <p style="color: #0369a1; font-size: 0.9rem; margin: 0;">
                    <strong>Filename:</strong> ${visaFileInfo.filename}<br>
                    <strong>File Hash:</strong> ${visaFileInfo.file_hash.substring(0, 16)}...
                  </p>
                </div>
              </div>
            `,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Understood',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              htmlContainer: 'custom-swal-html',
              confirmButton: 'custom-swal-confirm'
            },
            buttonsStyling: false
          });
          
          return;
        }
        
        // Store visa file info
        updatedTravelers[index].visaFileInfo = visaFileInfo;
        updatedTravelers[index].uploadingVisa = false;
        setBookingData({ ...bookingData, travelers: updatedTravelers });
        
        // Show success message
        await Swal.fire({
          title: 'Visa Document Uploaded!',
          html: `
            <div style="text-align: left; margin: 1rem 0;">
              <div style="background: #d1fae5; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; text-align: center;">
                <svg style="width: 3rem; height: 3rem; color: #059669; margin-bottom: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style="color: #065f46; font-weight: 600; margin: 0;">Visa document uploaded successfully!</p>
              </div>
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
                <p style="margin: 0.25rem 0;"><strong>Filename:</strong> ${visaFileInfo.filename}</p>
                <p style="margin: 0.25rem 0;"><strong>Size:</strong> ${(visaFileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                <p style="margin: 0.25rem 0;"><strong>Type:</strong> ${visaFileInfo.type}</p>
                <p style="margin: 0.25rem 0;"><strong>Uploaded:</strong> ${new Date(visaFileInfo.uploaded_at).toLocaleString()}</p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#059669',
          confirmButtonText: 'Continue',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html',
            confirmButton: 'custom-swal-confirm'
          },
          buttonsStyling: false
        });
      } else {
        throw new Error(result.error || 'Failed to upload visa document');
      }
    } catch (err) {
      updatedTravelers[index].uploadingVisa = false;
      updatedTravelers[index].visaError = err.message || 'Failed to upload visa document';
      setBookingData({ ...bookingData, travelers: updatedTravelers });
      
      await Swal.fire({
        title: 'Upload Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <svg style="width: 3rem; height: 3rem; color: #dc2626; margin-bottom: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">Failed to upload visa document</p>
              <p style="color: #991b1b; font-size: 0.9rem;">${err.message || 'Please try again with a valid image file'}</p>
            </div>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
              <p style="color: #0369a1; font-size: 0.9rem; margin: 0 0 0.5rem 0;"><strong>Common issues:</strong></p>
              <ul style="text-align: left; color: #0369a1; font-size: 0.875rem; margin: 0; padding-left: 1.5rem;">
                <li>File is not an image (JPG, PNG, etc.)</li>
                <li>File size is too large (max 16MB)</li>
                <li>Image is corrupted or invalid</li>
                <li>Network connection issues</li>
                <li>Server temporarily unavailable</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
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

  const viewVisaData = (index) => {
    const traveler = bookingData.travelers[index];
    const visaFileInfo = traveler.visaFileInfo;
    
    if (!visaFileInfo) return;
    
    Swal.fire({
      title: '📄 Uploaded Visa Document',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.75rem 0; color: #1e40af; font-size: 1rem;">File Information</h4>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Filename:</strong>
              <span>${visaFileInfo.filename}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>File Type:</strong>
              <span>${visaFileInfo.type}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>File Size:</strong>
              <span>${(visaFileInfo.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
              <strong>Uploaded:</strong>
              <span>${new Date(visaFileInfo.uploaded_at).toLocaleString()}</span>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; color: #6b7280;">
            <strong>File Hash:</strong><br>
            <code style="background: #e5e7eb; padding: 0.25rem; border-radius: 0.25rem;">${visaFileInfo.file_hash}</code>
          </div>
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

  const viewPassportData = (index) => {
    const traveler = bookingData.travelers[index];
    const passportData = traveler.passportData;
    
    if (!passportData) return;
    
    Swal.fire({
      title: '🛂 Passport Information',
      html: `
        <div style="text-align: left; margin: 1rem 0; max-height: 400px; overflow-y: auto;">
          <div style="display: grid; gap: 1rem;">
            ${passportData.passport_type ? `<div><strong>Type:</strong> ${passportData.passport_type}</div>` : ''}
            ${passportData.country_code ? `<div><strong>Country:</strong> ${passportData.country_code}</div>` : ''}
            ${passportData.passport_number ? `<div><strong>Passport No:</strong> ${passportData.passport_number}</div>` : ''}
            ${passportData.surname ? `<div><strong>Surname:</strong> ${passportData.surname}</div>` : ''}
            ${passportData.given_names ? `<div><strong>Given Names:</strong> ${passportData.given_names}</div>` : ''}
            ${passportData.nationality ? `<div><strong>Nationality:</strong> ${passportData.nationality}</div>` : ''}
            ${passportData.date_of_birth ? `<div><strong>Date of Birth:</strong> ${passportData.date_of_birth}</div>` : ''}
            ${passportData.place_of_birth ? `<div><strong>Place of Birth:</strong> ${passportData.place_of_birth}</div>` : ''}
            ${passportData.sex ? `<div><strong>Sex:</strong> ${passportData.sex}</div>` : ''}
            ${passportData.date_of_issue ? `<div><strong>Issue Date:</strong> ${passportData.date_of_issue}</div>` : ''}
            ${passportData.date_of_expiry ? `<div><strong>Expiry Date:</strong> ${passportData.date_of_expiry}</div>` : ''}
            ${passportData.issuing_authority ? `<div><strong>Issuing Authority:</strong> ${passportData.issuing_authority}</div>` : ''}
          </div>
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

  const handleStripePaymentSuccess = async (paymentIntent) => {
    console.log('Payment success handler called:', paymentIntent);
    
    try {
      // Show loading state
      const loadingTitle = completingOrderId ? 'Completing Your Payment...' : 'Creating Your Booking...';
      const loadingMessage = completingOrderId ? 'Payment successful! Updating your order...' : 'Payment successful! Creating your booking...';
      
      Swal.fire({
        title: loadingTitle,
        html: loadingMessage,
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

      // Create order with payment data
      const response = await createOrderWithPaymentData(paymentIntent.id);

      // Show success message
      const successTitle = completingOrderId ? 'Payment Completed!' : 'Payment Successful!';
      const successMessage = completingOrderId ? 'Your order payment has been completed successfully!' : 'Your payment has been processed successfully!';
      const orderNumberLabel = completingOrderId ? 'Your Order Number:' : 'Order Number:';
      
      const result = await Swal.fire({
        title: successTitle,
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">${successMessage}</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">${orderNumberLabel}</p>
            <p style="font-weight: 600; color: #1f2937; font-family: monospace; font-size: 1.1rem;">${response.order.orderNumber || existingOrder?.orderNumber}</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Payment ID:</p>
            <p style="font-weight: 600; color: #1f2937; font-family: monospace; font-size: 0.9rem;">${paymentIntent.id}</p>
            <div style="background: #f0f8ff; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
              <p style="color: #0284c7; margin: 0; font-size: 0.9rem;">Your booking is pending company confirmation. You'll receive an email once it's confirmed.</p>
            </div>
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

      // Redirect to order details after user clicks button
      if (result.isConfirmed) {
        console.log('Redirecting to order details...');
        router.push(`/customer/orders/${response.order.id}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      handleStripePaymentError('Payment was successful but there was an error creating your booking. Please contact support with payment ID: ' + paymentIntent.id);
    }
  };

  const handleStripePaymentError = async (error) => {
    console.log('Payment error handler called:', error);
    
    // First show payment failure and ask if they want to save order
    const confirmResult = await Swal.fire({
      title: 'Payment Failed',
      html: `
        <div style="text-align: center; margin: 1rem 0;">
          <p style="color: #ef4444; margin-bottom: 1rem; font-weight: 600;">Your payment could not be processed</p>
          <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">${error}</p>
          
          <div style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #dc2626; margin: 0; font-size: 0.9rem;">You have not been charged.</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; margin: 0 0 0.5rem 0; font-weight: 600;">Save Your Booking?</p>
            <p style="color: #1e3a8a; margin: 0; font-size: 0.9rem;">We can save your booking details so you can complete payment later from your orders page.</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Save Order',
      cancelButtonText: 'Try Payment Again',
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

    // If user chooses not to save order, just return (stay on booking page)
    if (!confirmResult.isConfirmed) {
      return;
    }

    // Show loading state while creating draft order
    Swal.fire({
      title: 'Saving Your Order...',
      html: 'Creating your order for later payment completion.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Create a draft order with payment pending
      const orderData = {
        packageId: parseInt(packageId),
        numberOfTravelers: bookingData.numberOfAdults + bookingData.numberOfChildren,
        numberOfAdults: bookingData.numberOfAdults,
        numberOfChildren: bookingData.numberOfChildren,
        travelers: bookingData.travelers,
        specialRequests: bookingData.specialRequests,
        paymentMethod: 'stripe',
        paymentStatus: 'pending', // Payment pending since Stripe failed
        status: 'draft', // Draft status until payment completes
        stripePaymentIntentId: null
      };

      const response = await orderService.createOrder(orderData);
      
      // Show success message with draft order created
      await Swal.fire({
        title: 'Order Saved Successfully',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 4px solid #10b981;">
              <p style="color: #059669; margin: 0 0 0.5rem 0; font-weight: 600;">Order Created!</p>
              <p style="color: #047857; margin: 0; font-size: 0.9rem;">Your booking details have been saved. You can complete payment anytime from your orders page.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <p style="color: #374151; margin: 0 0 0.5rem 0; font-size: 0.9rem;"><strong>Order Number:</strong></p>
              <p style="color: #1f2937; margin: 0; font-family: monospace; font-weight: 600;">${response.order.orderNumber}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem;">
              <p style="color: #92400e; margin: 0; font-size: 0.9rem;">⏰ Remember to complete payment to confirm your booking.</p>
            </div>
          </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'View My Orders',
        cancelButtonText: 'Continue Browsing',
        reverseButtons: true,
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm',
          cancelButton: 'custom-swal-cancel'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to orders page
          router.push('/customer/orders');
        }
        // If cancelled, user stays on current page
      });

    } catch (orderError) {
      console.error('Error creating draft order:', orderError);
      
      // Show error message if order creation fails
      await Swal.fire({
        title: 'Unable to Save Order',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">Payment failed and we couldn't save your order</p>
            <div style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <p style="color: #dc2626; margin: 0; font-size: 0.9rem;">You have not been charged. Please try again or contact support.</p>
            </div>
            <p style="color: #6b7280; font-size: 0.85rem;">Error: ${orderError.error || 'Unknown error'}</p>
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

  const nextStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      
      // Scroll to step indicators when moving to step 2
      if (currentStep === 1) {
        setTimeout(() => {
          // Target the step indicators section specifically
          const stepsElement = document.querySelector('.customer-book-steps');
          if (stepsElement) {
            stepsElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100); // Small delay to ensure the step has updated
      }
    }
  };

  const prevStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      } else if (bookingData.paymentMethod === 'stripe') {
        return true; // Stripe validation will be handled during payment processing
      } else if (bookingData.paymentMethod === 'cash') {
        return true; // Cash payment requires no additional validation
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
    
    // For Stripe payments, don't show confirmation - let Stripe form handle everything
    if (bookingData.paymentMethod === 'stripe') {
      setError('');
      return; // Let Stripe form handle the payment and order creation
    }
    
    // Show confirmation dialog for non-Stripe payments
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

    await createOrderWithPaymentData();
  };

  const createOrderWithPaymentData = async (stripePaymentIntentId = null) => {
    try {
      let response;
      
      if (completingOrderId) {
        // Update existing draft order with payment data
        const updateData = {
          stripePaymentIntentId,
          paymentStatus: 'completed',
          status: 'pending'  // Change from draft to pending after payment
        };
        
        response = await orderService.updateOrder(completingOrderId, updateData);
        response.order = { ...existingOrder, ...updateData, id: completingOrderId };
      } else {
        // Create new order
        const orderData = {
          packageId: packageData.id,
          numberOfTravelers: bookingData.numberOfTravelers,
          numberOfAdults: bookingData.numberOfAdults,
          numberOfChildren: bookingData.numberOfChildren,
          travelers: bookingData.travelers.map(traveler => ({
            name: traveler.name,
            passportNumber: traveler.passportNumber,
            dateOfBirth: traveler.dateOfBirth,
            gender: traveler.gender,
            isChild: traveler.isChild,
            passportData: traveler.passportData,
            visaFileInfo: traveler.visaFileInfo,
            needsPassportAssistance: traveler.needsPassportAssistance,
            needsVisaAssistance: traveler.needsVisaAssistance
          })),
          specialRequests: bookingData.specialRequests,
          paymentMethod: bookingData.paymentMethod,
          paymentReceiptPath: bookingData.paymentReceiptFile?.path,
          paymentReceiptOriginalName: bookingData.paymentReceiptFile?.originalName,
          paymentNotes: bookingData.paymentNotes,
          // For Stripe payments, include payment intent ID and mark payment as completed
          // but keep order status as pending for company confirmation
          ...(stripePaymentIntentId && {
            stripePaymentIntentId,
            paymentStatus: 'completed',
            status: 'pending'  // Company should confirm the order
          }),
          // For other payment methods, set as pending
          ...(!stripePaymentIntentId && bookingData.paymentMethod !== 'stripe' && {
            paymentStatus: 'pending',
            status: 'pending'
          })
        };

        response = await orderService.createOrder(orderData);
      }
      
      // For Stripe payments, don't show success message here - let the caller handle it
      if (stripePaymentIntentId) {
        return response;
      }
      
      // Show success message for non-Stripe payments only
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
      
      return response;
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
                                      id={`passport-input-${index}`}
                                      className={`customer-book-form-input ${traveler.passportError ? 'error' : ''}`}
                                      value={traveler.passportNumber}
                                      onChange={(e) => handleTravelerChange(index, 'passportNumber', e.target.value)}
                                      placeholder="Enter passport number"
                                      required
                                    />
                                    {traveler.passportError && (
                                      <div className="customer-book-field-error">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{traveler.passportError}</span>
                                      </div>
                                    )}
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
                                
                                {/* Passport Upload */}
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                    </svg>
                                    Upload Passport (Optional)
                                  </label>
                                  <div className="customer-book-passport-upload">
                                    <input
                                      type="file"
                                      id={`passport-${index}`}
                                      accept="image/*"
                                      onChange={(e) => handlePassportUpload(index, e.target.files[0])}
                                      style={{ display: 'none' }}
                                    />
                                    <label htmlFor={`passport-${index}`} className="customer-book-passport-upload-label">
                                      {traveler.uploadingPassport ? (
                                        <div className="customer-book-passport-extracting">
                                          <div className="passport-ai-loader">
                                            <div className="ai-scanner">
                                              <div className="scanner-line"></div>
                                              <svg className="passport-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                              </svg>
                                            </div>
                                            <div className="ai-particles">
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                            </div>
                                          </div>
                                          <div className="passport-extracting-text">
                                            <h4>Our AI is extracting passport information</h4>
                                            <p>This usually takes 3-5 seconds...</p>
                                          </div>
                                          <div className="extraction-progress">
                                            <div className="progress-bar-ai">
                                              <div className="progress-fill-ai"></div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : traveler.passportData ? (
                                        <div className="customer-book-passport-upload-success">
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>Passport data extracted</span>
                                          <button
                                            type="button"
                                            className="customer-book-passport-view-btn"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              viewPassportData(index);
                                            }}
                                          >
                                            View Details
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="customer-book-file-upload-placeholder">
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <span>Click to upload passport image</span>
                                          <small>AI will extract passport details automatically</small>
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                  {traveler.passportError && (
                                    <div className="customer-book-passport-error">
                                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{traveler.passportError}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Visa Upload */}
                                <div className="customer-book-form-group">
                                  <label className="customer-book-form-label">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    Upload Visa (Optional)
                                  </label>
                                  <div className="customer-book-visa-upload">
                                    <input
                                      type="file"
                                      id={`visa-${index}`}
                                      accept="image/*"
                                      onChange={(e) => handleVisaUpload(index, e.target.files[0])}
                                      style={{ display: 'none' }}
                                    />
                                    <label htmlFor={`visa-${index}`} className="customer-book-visa-upload-label">
                                      {traveler.uploadingVisa ? (
                                        <div className="customer-book-visa-extracting">
                                          <div className="visa-ai-loader">
                                            <div className="ai-scanner">
                                              <div className="scanner-line"></div>
                                              <svg className="visa-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                              </svg>
                                            </div>
                                            <div className="ai-particles">
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                              <span className="particle"></span>
                                            </div>
                                          </div>
                                          <div className="visa-extracting-text">
                                            <h4>Uploading visa document</h4>
                                            <p>Processing your document...</p>
                                          </div>
                                          <div className="extraction-progress">
                                            <div className="progress-bar-ai">
                                              <div className="progress-fill-ai"></div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : traveler.visaFileInfo ? (
                                        <div className="customer-book-visa-upload-success">
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>Visa document uploaded</span>
                                          <button
                                            type="button"
                                            className="customer-book-visa-view-btn"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              viewVisaData(index);
                                            }}
                                          >
                                            View Details
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="customer-book-file-upload-placeholder">
                                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <span>Click to upload visa document</span>
                                          <small>Upload your visa document for processing</small>
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                  {traveler.visaError && (
                                    <div className="customer-book-visa-error">
                                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{traveler.visaError}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Assistance Request Section */}
                                {(packageData.includesPassportAssistance || packageData.includesVisaAssistance) && (
                                  <div className="customer-book-assistance-section">
                                    <h5 className="customer-book-assistance-title">
                                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                      </svg>
                                      Need Assistance?
                                    </h5>
                                    <p className="customer-book-assistance-description">
                                      If you don't have a passport or visa, we can help you obtain them.
                                    </p>
                                    
                                    {packageData.includesPassportAssistance && (
                                      <div className="customer-book-assistance-option">
                                        <label className="customer-book-assistance-checkbox">
                                          <input
                                            type="checkbox"
                                            checked={traveler.needsPassportAssistance}
                                            onChange={(e) => handleTravelerChange(index, 'needsPassportAssistance', e.target.checked)}
                                          />
                                          <span className="customer-book-checkmark"></span>
                                          <div className="customer-book-assistance-details">
                                            <span className="customer-book-assistance-name">Passport Assistance</span>
                                            <span className="customer-book-assistance-fee">
                                              {packageData.passportAssistanceFee > 0 ? `+${formatCurrency(packageData.passportAssistanceFee)}` : 'Included'}
                                            </span>
                                          </div>
                                        </label>
                                      </div>
                                    )}
                                    
                                    {packageData.includesVisaAssistance && (
                                      <div className="customer-book-assistance-option">
                                        <label className="customer-book-assistance-checkbox">
                                          <input
                                            type="checkbox"
                                            checked={traveler.needsVisaAssistance}
                                            onChange={(e) => handleTravelerChange(index, 'needsVisaAssistance', e.target.checked)}
                                          />
                                          <span className="customer-book-checkmark"></span>
                                          <div className="customer-book-assistance-details">
                                            <span className="customer-book-assistance-name">Visa Assistance</span>
                                            <span className="customer-book-assistance-fee">
                                              {packageData.visaAssistanceFee > 0 ? `+${formatCurrency(packageData.visaAssistanceFee)}` : 'Included'}
                                            </span>
                                          </div>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                )}
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
                      {/* Show payment message for completing existing orders */}
                      {completingOrderId && (
                        <div className="customer-book-completing-order-notice">
                          <div className="customer-book-notice-header">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3>Complete Your Payment</h3>
                          </div>
                          <p>You're completing payment for order <strong>{existingOrder?.orderNumber}</strong>. Payment will be processed securely through Stripe.</p>
                        </div>
                      )}
                      
                      {/* Payment Method Selection - only show for new orders */}
                      {!completingOrderId && (
                        <div className="customer-book-form-group">
                          <label className="customer-book-form-label">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Payment Method
                          </label>
                        <div className="customer-book-payment-options">
                          {getAvailablePaymentMethods().includes('stripe') && (
                            <div className="customer-book-payment-option">
                              <input
                                type="radio"
                                id="stripe"
                                name="paymentMethod"
                                value="stripe"
                                checked={bookingData.paymentMethod === 'stripe'}
                                onChange={(e) => setBookingData({
                                  ...bookingData,
                                  paymentMethod: e.target.value,
                                  paymentReceiptFile: null
                                })}
                              />
                              <label htmlFor="stripe" className="customer-book-payment-label">
                                <div className="customer-book-payment-icon">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                </div>
                                <div className="customer-book-payment-info">
                                  <div className="customer-book-payment-title">Online Payment</div>
                                  <div className="customer-book-payment-desc">Pay securely with Stripe</div>
                                </div>
                              </label>
                            </div>
                          )}
                          
                          {getAvailablePaymentMethods().includes('cash') && (
                            <div className="customer-book-payment-option">
                              <input
                                type="radio"
                                id="cash"
                                name="paymentMethod"
                                value="cash"
                                checked={bookingData.paymentMethod === 'cash'}
                                onChange={(e) => setBookingData({
                                  ...bookingData,
                                  paymentMethod: e.target.value,
                                  paymentReceiptFile: null
                                })}
                              />
                              <label htmlFor="cash" className="customer-book-payment-label">
                                <div className="customer-book-payment-icon">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <div className="customer-book-payment-info">
                                  <div className="customer-book-payment-title">Cash Payment</div>
                                  <div className="customer-book-payment-desc">Pay in cash upon arrival or at office</div>
                                </div>
                              </label>
                            </div>
                          )}
                          
                          {getAvailablePaymentMethods().includes('bank_transfer') && (
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
                          )}
                        </div>
                      </div>
                      )}

                      {/* Credit Card Form */}
                      {/* Stripe Payment Form */}
                      {bookingData.paymentMethod === 'stripe' && (
                        <div className="customer-book-stripe-section">
                          <div className="customer-book-stripe-header">
                            <h4 className="customer-book-stripe-title">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Secure Online Payment
                            </h4>
                            <div className="customer-book-secure-badge">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Powered by Stripe - Bank-level security</span>
                            </div>
                          </div>

                          <div className="customer-book-stripe-form">
                            <div className="customer-book-stripe-info">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>Complete your payment securely using Stripe. You will be redirected to enter your card details on a secure payment page.</p>
                            </div>
                            
                            <StripePaymentForm
                              amount={packageData.price * bookingData.numberOfTravelers}
                              onSuccess={handleStripePaymentSuccess}
                              onError={handleStripePaymentError}
                            />

                            <div className="customer-book-payment-notice">
                              <div className="customer-book-notice-content">
                                <h5>Payment Information</h5>
                                <ul>
                                  <li>Your payment will be processed securely through Stripe</li>
                                  <li>We accept all major credit and debit cards</li>
                                  <li>Payment confirmation will be sent via email</li>
                                  <li>Booking will be confirmed upon successful payment</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cash Payment Information */}
                      {bookingData.paymentMethod === 'cash' && (
                        <div className="customer-book-cash-section">
                          <div className="customer-book-cash-header">
                            <h4 className="customer-book-cash-title">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Cash Payment Instructions
                            </h4>
                          </div>

                          <div className="customer-book-cash-info">
                            <div className="customer-book-cash-notice">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <h5>Important Notice</h5>
                                <p>By selecting cash payment, you agree to pay the full amount in cash according to the terms below.</p>
                              </div>
                            </div>

                            <div className="customer-book-cash-options">
                              <div className="customer-book-cash-option">
                                <div className="customer-book-cash-option-header">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <h6>Office Payment</h6>
                                </div>
                                <ul>
                                  <li>Visit our office during business hours</li>
                                  <li>Bring your booking reference number</li>
                                  <li>Payment must be completed before departure date</li>
                                  <li>Office Address: [Office Address]</li>
                                  <li>Business Hours: Monday - Friday, 9:00 AM - 6:00 PM</li>
                                </ul>
                              </div>

                              <div className="customer-book-cash-option">
                                <div className="customer-book-cash-option-header">
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  <h6>Payment Upon Arrival</h6>
                                </div>
                                <ul>
                                  <li>Pay cash at the meeting point on departure day</li>
                                  <li>Arrive 30 minutes early for payment processing</li>
                                  <li>Exact amount preferred (limited change available)</li>
                                  <li>Payment receipt will be provided</li>
                                </ul>
                              </div>
                            </div>

                            <div className="customer-book-cash-terms">
                              <div className="customer-book-terms-header">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h6>Terms & Conditions</h6>
                              </div>
                              <ul>
                                <li>Booking confirmation will be sent immediately</li>
                                <li>Payment must be completed as per selected option</li>
                                <li>Failure to pay may result in booking cancellation</li>
                                <li>No refunds for partial payments</li>
                                <li>Contact us for any payment-related queries</li>
                              </ul>
                            </div>

                            <div className="customer-book-cash-contact">
                              <div className="customer-book-contact-info">
                                <h6>Need Help?</h6>
                                <p>Contact our customer service team for assistance with cash payment options.</p>
                                <div className="customer-book-contact-details">
                                  <div className="customer-book-contact-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>+1 (555) 123-4567</span>
                                  </div>
                                  <div className="customer-book-contact-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>support@umrahfi.com</span>
                                  </div>
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

              {/* Step Navigation and Total - Hide when completing existing order */}
              {!completingOrderId && (
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
                  
                  {/* Navigation Actions - Hide when completing existing order */}
                  {!completingOrderId && (
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
                          className={`customer-book-btn-primary ${bookingData.paymentMethod === 'stripe' ? 'disabled-stripe' : ''}`}
                          disabled={submitting || !isStepValid() || bookingData.paymentMethod === 'stripe'}
                          title={bookingData.paymentMethod === 'stripe' ? 'Use the Stripe payment form above to complete your booking' : ''}
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
                              {bookingData.paymentMethod === 'stripe' ? 'Use Stripe Form Above' : 'Confirm Booking'}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  )}
                </div>
              </div>
              )}
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}