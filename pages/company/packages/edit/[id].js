import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import packageService from '@/services/packageService';
import packageTemplateService from '@/services/packageTemplateService';
import { getAirports, getAirportsByCountry, formatAirportDisplay } from '@/utils/airports';
import { getCountries } from '@/utils/countries';
import Icon from '@/components/FontAwesome';
import DateRangePickerInline from '@/components/DateRangePickerInline';
import Swal from 'sweetalert2';

export default function EditPackage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [departureAirports, setDepartureAirports] = useState([]);
  const [arrivalAirports] = useState(() => getAirports().filter(airport => ['JED', 'RUH', 'DMM', 'MED'].includes(airport.iata)));
  const [countries] = useState(() => getCountries());
  const [templates, setTemplates] = useState({ inclusions: [], exclusions: [] });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [autocompleteData, setAutocompleteData] = useState({ inclusions: [], exclusions: [] });
  const [showSuggestions, setShowSuggestions] = useState({ field: null, index: null, suggestions: [], selectedIndex: -1 });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    childPrice: '',
    duration: '',
    makkahDays: '7',
    madinaDays: '3',
    departureDate: '',
    returnDate: '',
    departureAirports: [''],
    arrivalAirports: ['JED'],
    totalSeats: '',
    availableSeats: '',
    makkahHotels: [{ name: '', rating: '3' }],
    madinahHotels: [{ name: '', rating: '3' }],
    mealPlan: 'Breakfast',
    transportation: 'Flight',
    country: 'Saudi Arabia',
    inclusions: [''],
    exclusions: [''],
    itinerary: [{ day: 1, description: '' }],
    images: [],
    specialRequests: ''
  });

  useEffect(() => {
    if (!router.isReady) return;
    
    if (id) {
      fetchPackageData();
      fetchTemplates();
    }
  }, [router.isReady, id]);

  useEffect(() => {
    // Set departure airports based on current user's country
    if (user?.country) {
      const countryAirports = getAirportsByCountry(user.country);
      setDepartureAirports(countryAirports);
    } else {
      // If no country is set, show all airports (fallback)
      setDepartureAirports(getAirports());
    }
  }, [user]);

  const fetchPackageData = async () => {
    try {
      setPageLoading(true);
      const response = await packageService.getPackageById(id);
      const pkg = response.package;
      
      setPackageData(pkg);
      
      // Format dates for input fields
      const formatDateForInput = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
      };

      // Set form data with existing package data
      setFormData({
        title: pkg.title || '',
        description: pkg.description || '',
        price: pkg.price?.toString() || '',
        childPrice: pkg.childPrice?.toString() || '',
        duration: pkg.duration?.toString() || '',
        makkahDays: pkg.makkahDays?.toString() || '7',
        madinaDays: pkg.madinaDays?.toString() || '3',
        departureDate: formatDateForInput(pkg.departureDate),
        returnDate: formatDateForInput(pkg.returnDate),
        departureAirports: pkg.departureAirports && pkg.departureAirports.length > 0 ? pkg.departureAirports : (pkg.departureAirport ? [pkg.departureAirport] : ['']),
        arrivalAirports: pkg.arrivalAirports && pkg.arrivalAirports.length > 0 ? pkg.arrivalAirports : (pkg.arrivalAirport ? [pkg.arrivalAirport] : ['JED']),
        totalSeats: pkg.totalSeats?.toString() || '',
        availableSeats: pkg.availableSeats?.toString() || '',
        makkahHotels: pkg.makkahHotels && pkg.makkahHotels.length > 0 ? pkg.makkahHotels : (pkg.hotelName ? [{ name: pkg.hotelName, rating: pkg.hotelRating?.toString() || '3' }] : [{ name: '', rating: '3' }]),
        madinahHotels: pkg.madinahHotels && pkg.madinahHotels.length > 0 ? pkg.madinahHotels : [{ name: '', rating: '3' }],
        mealPlan: pkg.mealPlan || 'Breakfast',
        transportation: pkg.transportation || 'Flight',
        country: user?.country || pkg.country || 'Saudi Arabia',
        inclusions: pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [''],
        exclusions: pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : [''],
        itinerary: pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [{ day: 1, description: '' }],
        images: pkg.images || [],
        specialRequests: pkg.specialRequests || ''
      });

      // Set uploaded images if they exist
      if (pkg.images && pkg.images.length > 0) {
        setUploadedImages(pkg.images.map((img, index) => ({
          path: img,
          originalname: `Image ${index + 1}`,
          size: 0 // Size unknown for existing images
        })));
      }

    } catch (error) {
      console.error('Error fetching package:', error);
      setError('Failed to load package data');
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to load package data. Please try again.',
        icon: 'error',
        confirmButtonText: 'Go Back',
        customClass: {
          popup: 'custom-swal-popup'
        }
      }).then(() => {
        router.push('/company/packages');
      });
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const [inclusionsResponse, exclusionsResponse] = await Promise.all([
        packageTemplateService.getTemplates('inclusions'),
        packageTemplateService.getTemplates('exclusions')
      ]);
      
      setTemplates({
        inclusions: inclusionsResponse.templates,
        exclusions: exclusionsResponse.templates
      });
      
      // Flatten all template items for autocomplete
      const allInclusions = inclusionsResponse.templates.flatMap(template => template.items);
      const allExclusions = exclusionsResponse.templates.flatMap(template => template.items);
      
      setAutocompleteData({
        inclusions: [...new Set(allInclusions)], // Remove duplicates
        exclusions: [...new Set(allExclusions)]
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
    
    // Show autocomplete suggestions
    if (value.trim().length > 0 && (field === 'inclusions' || field === 'exclusions')) {
      const suggestions = autocompleteData[field].filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      
      if (suggestions.length > 0) {
        setShowSuggestions({ field, index, suggestions, selectedIndex: -1 });
      } else {
        setShowSuggestions({ field: null, index: null, suggestions: [], selectedIndex: -1 });
      }
    } else {
      setShowSuggestions({ field: null, index: null, suggestions: [], selectedIndex: -1 });
    }
  };

  const handleHotelChange = (field, index, property, value) => {
    const newHotels = [...formData[field]];
    newHotels[index][property] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newHotels
    }));
  };

  const addHotel = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { name: '', rating: '3' }]
    }));
  };

  const removeHotel = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e, field, index) => {
    if (showSuggestions.field === field && showSuggestions.index === index && showSuggestions.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1)
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShowSuggestions(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }));
      } else if (e.key === 'Enter' && showSuggestions.selectedIndex >= 0) {
        e.preventDefault();
        const selectedSuggestion = showSuggestions.suggestions[showSuggestions.selectedIndex];
        handleSuggestionClick(selectedSuggestion);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions({ field: null, index: null, suggestions: [], selectedIndex: -1 });
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { field, index } = showSuggestions;
    const newArray = [...formData[field]];
    newArray[index] = suggestion;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
    setShowSuggestions({ field: null, index: null, suggestions: [], selectedIndex: -1 });
  };

  const handleInputBlur = (e) => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions({ field: null, index: null, suggestions: [], selectedIndex: -1 });
    }, 200);
  };

  const handleInputFocus = (field, index, value) => {
    if (value.trim().length > 0) {
      const suggestions = autocompleteData[field].filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      if (suggestions.length > 0) {
        setShowSuggestions({ field, index, suggestions, selectedIndex: -1 });
      }
    }
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index][field] = value;
    setFormData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, description: '' }]
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const removeItineraryDay = (index) => {
    const newItinerary = formData.itinerary.filter((_, i) => i !== index);
    // Re-number days
    newItinerary.forEach((item, i) => {
      item.day = i + 1;
    });
    setFormData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const applyTemplate = (type, templateId) => {
    const template = templates[type].find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        [type]: [...template.items]
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const response = await packageTemplateService.uploadPackageImages(files);
      setUploadedImages(prev => [...prev, ...response.images]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...response.images.map(img => img.path)]
      }));
      
      Swal.fire({
        title: 'Success!',
        text: `${response.images.length} image(s) uploaded successfully`,
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to upload images', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.price && formData.childPrice && formData.duration && formData.makkahDays && formData.madinaDays;
      case 2:
        return formData.departureDate && formData.returnDate && formData.departureAirports.some(airport => airport.trim()) && formData.arrivalAirports.some(airport => airport.trim()) && formData.totalSeats && formData.availableSeats;
      case 3:
        return formData.makkahHotels.some(hotel => hotel.name.trim());
      case 4:
        return formData.itinerary.some(item => item.description.trim());
      case 5:
        return true; // Inclusions/exclusions step (optional)
      case 6:
        return true; // Images step (optional)
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep !== totalSteps) {
      return;
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Update Package?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">You're about to update:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">${formData.title}</p>
          <div style="background: #f0f8ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #6b7280; margin: 0.25rem 0;">• Adult Price: $${formData.price} per person</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Child Price: $${formData.childPrice} per child</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Duration: ${formData.duration} days</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Total Seats: ${formData.totalSeats}</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Departure: ${new Date(formData.departureDate).toLocaleDateString()}</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Departure: ${formData.departureAirports.filter(a => a).join(', ')}</p>
            <p style="color: #6b7280; margin: 0.25rem 0;">• Arrival: ${formData.arrivalAirports.filter(a => a).join(', ')}</p>
          </div>
          <p style="color: #6b7280; font-size: 0.9rem;">The changes will be saved and reflected immediately.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Update Package',
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
    setLoading(true);

    // Show loading state
    Swal.fire({
      title: 'Updating Package...',
      html: 'Please wait while we update your package.',
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
      // Prepare data
      const updateData = {
        ...formData,
        price: Number(formData.price),
        childPrice: Number(formData.childPrice),
        duration: Number(formData.duration),
        makkahDays: Number(formData.makkahDays),
        madinaDays: Number(formData.madinaDays),
        totalSeats: Number(formData.totalSeats),
        availableSeats: Number(formData.availableSeats),
        departureAirports: formData.departureAirports.filter(airport => airport.trim()),
        arrivalAirports: formData.arrivalAirports.filter(airport => airport.trim()),
        makkahHotels: formData.makkahHotels.filter(hotel => hotel.name.trim()).map(hotel => ({
          ...hotel,
          rating: Number(hotel.rating)
        })),
        madinahHotels: formData.madinahHotels.filter(hotel => hotel.name.trim()).map(hotel => ({
          ...hotel,
          rating: Number(hotel.rating)
        })),
        inclusions: formData.inclusions.filter(item => item.trim()),
        exclusions: formData.exclusions.filter(item => item.trim()),
        itinerary: formData.itinerary.filter(item => item.description.trim())
      };

      const response = await packageService.updatePackage(id, updateData);
      
      // Show success message
      await Swal.fire({
        title: 'Package Updated!',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 1rem;">Your package has been successfully updated!</p>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Package:</p>
            <p style="font-weight: 600; color: #1f2937;">${formData.title}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'View Packages',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html',
          confirmButton: 'custom-swal-confirm'
        },
        buttonsStyling: false
      });
      
      router.push('/company/packages');
    } catch (err) {
      Swal.close();
      setError(err.error || 'Failed to update package');
      
      // Show error message
      await Swal.fire({
        title: 'Update Failed',
        html: `
          <div style="text-align: center; margin: 1rem 0;">
            <p style="color: #ef4444; margin-bottom: 1rem;">${err.error || 'Failed to update package'}</p>
            <p style="color: #6b7280; font-size: 0.9rem;">Please check your information and try again.</p>
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
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="info-circle" />
              </div>
              <h3 className="create-package-step-title">Basic Information</h3>
              <p className="create-package-step-description">
                Update the essential details about your Umrah package
              </p>
            </div>

            <div className="create-package-form-section">
              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Package Title</span>
                  <span className="create-package-required">*</span>
                </label>
                <div className="create-package-input-wrapper">
                  <div className="create-package-input-icon">
                    <Icon icon="tag" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="create-package-form-input"
                    placeholder="e.g., Premium Umrah Package 2025"
                    required
                  />
                </div>
              </div>

              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Package Description</span>
                  <span className="create-package-required">*</span>
                </label>
                <div className="create-package-input-wrapper">
                  <div className="create-package-input-icon">
                    <Icon icon="file-alt" />
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="create-package-form-textarea"
                    rows="4"
                    placeholder="Describe your package, highlighting what makes it special..."
                    required
                  />
                </div>
              </div>

              <div className="create-package-form-row">
                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Adult Price ($)</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="dollar-sign" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Child Price ($)</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="dollar-sign" />
                    </div>
                    <input
                      type="number"
                      name="childPrice"
                      value={formData.childPrice}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Duration (days)</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="calendar" />
                    </div>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="7"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="create-package-form-row">
                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Days in Makkah</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon={['fas', 'kaaba']} />
                    </div>
                    <input
                      type="number"
                      name="makkahDays"
                      value={formData.makkahDays}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="7"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Days in Madina</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon={['fas', 'mosque']} />
                    </div>
                    <input
                      type="number"
                      name="madinaDays"
                      value={formData.madinaDays}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="3"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="calendar-alt" />
              </div>
              <h3 className="create-package-step-title">Dates & Capacity</h3>
              <p className="create-package-step-description">
                Update your travel dates and passenger capacity
              </p>
            </div>

            <div className="create-package-form-section">
              <div className="create-package-form-row" style={{gridTemplateColumns: '1fr 150px 150px'}}>
                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Travel Dates</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <DateRangePickerInline
                    departureDate={formData.departureDate}
                    returnDate={formData.returnDate}
                    duration={formData.duration}
                    onDatesChange={(dates) => {
                      setFormData(prev => ({
                        ...prev,
                        departureDate: dates.departureDate,
                        returnDate: dates.returnDate
                      }));
                    }}
                  />
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Total Seats</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="users" />
                    </div>
                    <input
                      type="number"
                      name="totalSeats"
                      value={formData.totalSeats}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="50"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Available Seats</span>
                    <span className="create-package-required">*</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="user-check" />
                    </div>
                    <input
                      type="number"
                      name="availableSeats"
                      value={formData.availableSeats}
                      onChange={handleChange}
                      className="create-package-form-input"
                      placeholder="50"
                      min="0"
                      max={formData.totalSeats}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Departure Airports */}
              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Departure Airports</span>
                  <span className="create-package-required">*</span>
                </label>
                <div className="create-package-list">
                  {formData.departureAirports.map((airport, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-input-wrapper">
                        <div className="create-package-input-icon">
                          <Icon icon="plane-departure" />
                        </div>
                        <select
                          value={airport}
                          onChange={(e) => handleArrayChange('departureAirports', index, e.target.value)}
                          className="create-package-form-select"
                          required={index === 0}
                        >
                          <option value="">Select departure airport</option>
                          {departureAirports.map(airportOption => (
                            <option key={airportOption.iata} value={airportOption.iata}>
                              {airportOption.iata} - {airportOption.name}, {airportOption.city}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.departureAirports.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('departureAirports', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayField('departureAirports')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Departure Option</span>
                </button>
              </div>

              {/* Arrival Airports */}
              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Arrival Airports</span>
                  <span className="create-package-required">*</span>
                </label>
                <div className="create-package-list">
                  {formData.arrivalAirports.map((airport, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-input-wrapper">
                        <div className="create-package-input-icon">
                          <Icon icon="plane-arrival" />
                        </div>
                        <select
                          value={airport}
                          onChange={(e) => handleArrayChange('arrivalAirports', index, e.target.value)}
                          className="create-package-form-select"
                          required={index === 0}
                        >
                          <option value="">Select arrival airport</option>
                          {arrivalAirports.map(airportOption => (
                            <option key={airportOption.iata} value={airportOption.iata}>
                              {airportOption.iata} - {airportOption.name}, {airportOption.city}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.arrivalAirports.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('arrivalAirports', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayField('arrivalAirports')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Arrival Option</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="hotel" />
              </div>
              <h3 className="create-package-step-title">Accommodation & Travel</h3>
              <p className="create-package-step-description">
                Update hotel details, transportation, and destination information
              </p>
            </div>

            <div className="create-package-form-section">
              {/* Makkah Hotels */}
              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Makkah Hotels</span>
                  <span className="create-package-required">*</span>
                </label>
                <div className="create-package-list">
                  {formData.makkahHotels.map((hotel, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-hotel-row">
                        <div className="create-package-input-wrapper">
                          <div className="create-package-input-icon">
                            <Icon icon="hotel" />
                          </div>
                          <input
                            type="text"
                            value={hotel.name}
                            onChange={(e) => handleHotelChange('makkahHotels', index, 'name', e.target.value)}
                            className="create-package-form-input"
                            placeholder="e.g., Makkah Hilton"
                            required={index === 0}
                          />
                        </div>
                        <div className="create-package-input-wrapper">
                          <div className="create-package-input-icon">
                            <Icon icon="star" />
                          </div>
                          <select
                            value={hotel.rating}
                            onChange={(e) => handleHotelChange('makkahHotels', index, 'rating', e.target.value)}
                            className="create-package-form-select"
                          >
                            <option value="1">1 Star</option>
                            <option value="2">2 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="5">5 Stars</option>
                          </select>
                        </div>
                      </div>
                      {formData.makkahHotels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHotel('makkahHotels', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addHotel('makkahHotels')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Makkah Hotel</span>
                </button>
              </div>

              {/* Madinah Hotels */}
              <div className="create-package-form-group">
                <label className="create-package-form-label">
                  <span>Madinah Hotels</span>
                </label>
                <div className="create-package-list">
                  {formData.madinahHotels.map((hotel, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-hotel-row">
                        <div className="create-package-input-wrapper">
                          <div className="create-package-input-icon">
                            <Icon icon="hotel" />
                          </div>
                          <input
                            type="text"
                            value={hotel.name}
                            onChange={(e) => handleHotelChange('madinahHotels', index, 'name', e.target.value)}
                            className="create-package-form-input"
                            placeholder="e.g., Madinah Hilton"
                          />
                        </div>
                        <div className="create-package-input-wrapper">
                          <div className="create-package-input-icon">
                            <Icon icon="star" />
                          </div>
                          <select
                            value={hotel.rating}
                            onChange={(e) => handleHotelChange('madinahHotels', index, 'rating', e.target.value)}
                            className="create-package-form-select"
                          >
                            <option value="1">1 Star</option>
                            <option value="2">2 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="5">5 Stars</option>
                          </select>
                        </div>
                      </div>
                      {formData.madinahHotels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHotel('madinahHotels', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addHotel('madinahHotels')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Madinah Hotel</span>
                </button>
              </div>

              <div className="create-package-form-row">
                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Meal Plan</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="utensils" />
                    </div>
                    <select
                      name="mealPlan"
                      value={formData.mealPlan}
                      onChange={handleChange}
                      className="create-package-form-select"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Half Board">Half Board</option>
                      <option value="Full Board">Full Board</option>
                      <option value="All Inclusive">All Inclusive</option>
                    </select>
                  </div>
                </div>

                <div className="create-package-form-group">
                  <label className="create-package-form-label">
                    <span>Transportation</span>
                  </label>
                  <div className="create-package-input-wrapper">
                    <div className="create-package-input-icon">
                      <Icon icon="plane" />
                    </div>
                    <select
                      name="transportation"
                      value={formData.transportation}
                      onChange={handleChange}
                      className="create-package-form-select"
                    >
                      <option value="Flight">Flight</option>
                      <option value="Bus">Bus</option>
                      <option value="Train">Train</option>
                      <option value="Private Car">Private Car</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Country is auto-set from user data - no UI needed */}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="clipboard-list" />
              </div>
              <h3 className="create-package-step-title">Daily Itinerary</h3>
              <p className="create-package-step-description">
                Update the daily activities and schedule for your pilgrims
              </p>
            </div>

            <div className="create-package-form-section">
              <div className="create-package-itinerary-list">
                {formData.itinerary.map((item, index) => (
                  <div key={index} className="create-package-itinerary-item">
                    <div className="create-package-day-header">
                      <div className="create-package-day-number">
                        <Icon icon="calendar-day" /> Day {item.day}
                      </div>
                      {formData.itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                    <div className="create-package-input-wrapper">
                      <div className="create-package-input-icon">
                        <Icon icon="edit" />
                      </div>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                        className="create-package-form-textarea"
                        rows="3"
                        placeholder="Describe the activities, visits, and schedule for this day..."
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addItineraryDay}
                className="create-package-btn-add"
              >
                <Icon icon="plus" />
                <span>Add Another Day</span>
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="list-check" />
              </div>
              <h3 className="create-package-step-title">Inclusions & Exclusions</h3>
              <p className="create-package-step-description">
                Update what is and isn't included in your package or use templates
              </p>
            </div>

            <div className="create-package-form-section">
              {/* Templates Section */}
              {(templates.inclusions.length > 0 || templates.exclusions.length > 0) && (
                <div className="package-creation-templates-section">
                  <h4 className="package-creation-section-title">
                    <Icon icon="bookmark" />
                    Quick Templates
                  </h4>
                  <div className="package-creation-templates-grid">
                    {templates.inclusions.length > 0 && (
                      <div className="package-creation-template-category">
                        <label>Inclusion Templates:</label>
                        <select 
                          onChange={(e) => e.target.value && applyTemplate('inclusions', parseInt(e.target.value))}
                          className="package-creation-form-select"
                          defaultValue=""
                        >
                          <option value="">Choose a template...</option>
                          {templates.inclusions.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.items.length} items)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {templates.exclusions.length > 0 && (
                      <div className="package-creation-template-category">
                        <label>Exclusion Templates:</label>
                        <select 
                          onChange={(e) => e.target.value && applyTemplate('exclusions', parseInt(e.target.value))}
                          className="package-creation-form-select"
                          defaultValue=""
                        >
                          <option value="">Choose a template...</option>
                          {templates.exclusions.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.items.length} items)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="create-package-inclusions-section">
                <h4 className="create-package-section-title">
                  <Icon icon="check-circle" />
                  What's Included
                </h4>
                <div className="create-package-list">
                  {formData.inclusions.map((item, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-input-wrapper create-package-autocomplete-wrapper">
                        <div className="create-package-input-icon">
                          <Icon icon="check" />
                        </div>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('inclusions', index, e.target.value)}
                          onFocus={() => handleInputFocus('inclusions', index, item)}
                          onBlur={handleInputBlur}
                          onKeyDown={(e) => handleKeyDown(e, 'inclusions', index)}
                          className="create-package-form-input"
                          placeholder="e.g., Round-trip flights, Hotel accommodation..."
                        />
                        {showSuggestions.field === 'inclusions' && showSuggestions.index === index && (
                          <div className="create-package-autocomplete-dropdown">
                            {showSuggestions.suggestions.map((suggestion, suggestionIndex) => (
                              <div
                                key={suggestionIndex}
                                className={`create-package-autocomplete-item ${suggestionIndex === showSuggestions.selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <Icon icon="check" className="create-package-suggestion-icon" />
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.inclusions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('inclusions', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayField('inclusions')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Inclusion</span>
                </button>
              </div>

              <div className="create-package-exclusions-section">
                <h4 className="create-package-section-title">
                  <Icon icon="times-circle" />
                  What's Not Included
                </h4>
                <div className="create-package-list">
                  {formData.exclusions.map((item, index) => (
                    <div key={index} className="create-package-list-item">
                      <div className="create-package-input-wrapper create-package-autocomplete-wrapper">
                        <div className="create-package-input-icon">
                          <Icon icon="times" />
                        </div>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('exclusions', index, e.target.value)}
                          onFocus={() => handleInputFocus('exclusions', index, item)}
                          onBlur={handleInputBlur}
                          onKeyDown={(e) => handleKeyDown(e, 'exclusions', index)}
                          className="create-package-form-input"
                          placeholder="e.g., Personal expenses, Visa fees..."
                        />
                        {showSuggestions.field === 'exclusions' && showSuggestions.index === index && (
                          <div className="create-package-autocomplete-dropdown">
                            {showSuggestions.suggestions.map((suggestion, suggestionIndex) => (
                              <div
                                key={suggestionIndex}
                                className={`create-package-autocomplete-item ${suggestionIndex === showSuggestions.selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <Icon icon="times" className="create-package-suggestion-icon" />
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.exclusions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('exclusions', index)}
                          className="create-package-btn-remove"
                        >
                          <Icon icon="trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayField('exclusions')}
                  className="create-package-btn-add"
                >
                  <Icon icon="plus" />
                  <span>Add Exclusion</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="create-package-step">
            <div className="create-package-step-header">
              <div className="create-package-step-icon">
                <Icon icon="images" />
              </div>
              <h3 className="create-package-step-title">Package Images</h3>
              <p className="create-package-step-description">
                Update photos to showcase your package (optional)
              </p>
            </div>

            <div className="package-creation-form-section">
              <div className="package-image-upload-section">
                <div className="package-image-upload-area">
                  <input
                    type="file"
                    id="package-images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="package-image-file-input"
                    disabled={uploadingImages}
                  />
                  <label htmlFor="package-images" className="package-image-upload-label">
                    <div className="package-image-upload-icon">
                      <Icon icon={uploadingImages ? "spinner" : "camera"} spin={uploadingImages} />
                    </div>
                    <div className="package-image-upload-text">
                      <h4>
                        {uploadingImages ? 'Uploading images...' : 'Upload Additional Images'}
                      </h4>
                      <p>Click to select or drag and drop images here</p>
                      <span className="package-image-upload-info">
                        Maximum 10 images, 5MB each (JPG, PNG, GIF, WebP)
                      </span>
                    </div>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="package-image-preview-section">
                    <h4 className="package-creation-section-title">
                      <Icon icon="images" />
                      Package Images ({uploadedImages.length})
                    </h4>
                    <div className="package-image-grid">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="package-image-item">
                          <div className="package-image-thumbnail">
                            <img
                              src={image.path}
                              alt={image.originalname}
                              className="package-image-preview"
                            />
                            <div className="package-image-overlay">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="package-image-remove"
                                title="Remove image"
                              >
                                <Icon icon="trash" />
                              </button>
                            </div>
                          </div>
                          <div className="package-image-info">
                            <span className="package-image-name">
                              {image.originalname}
                            </span>
                            {image.size > 0 && (
                              <span className="package-image-size">
                                {(image.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="package-image-tips">
                    <h4><Icon icon="lightbulb" /> Tips for great package photos:</h4>
                    <ul>
                      <li>Show the hotel exterior and key facilities</li>
                      <li>Include photos of the holy sites and surroundings</li>
                      <li>Capture transportation and tour highlights</li>
                      <li>Use high-quality images with good lighting</li>
                      <li>Ensure images are relevant to your package</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (pageLoading) {
    return (
      <ProtectedRoute allowedRoles={['company']}>
        <Layout>
          <div className="create-package-container">
            <div className="create-package-background">
              <div className="create-package-pattern"></div>
              <div className="create-package-gradient"></div>
            </div>
            <div className="create-package-content">
              <div className="create-package-loading">
                <div className="create-package-loading-spinner"></div>
                <p>Loading package data...</p>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="create-package-container">
          <div className="create-package-background">
            <div className="create-package-pattern"></div>
            <div className="create-package-gradient"></div>
          </div>
          
          <div className="create-package-content">
            {/* Header */}
            <div className="create-package-header">
              <div className="create-package-breadcrumb">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="create-package-breadcrumb-link"
                >
                  <Icon icon="arrow-left" />
                  <span>Back to Packages</span>
                </button>
              </div>
              
              <div className="create-package-title-section">
                <div className="create-package-icon">
                  <Icon icon="edit" style={{ color: 'white' }} />
                </div>
                <h1 className="create-package-title">Edit Package</h1>
                <p className="create-package-subtitle">
                  Update your Umrah package details
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="create-package-progress">
              <div className="create-package-progress-bar">
                <div 
                  className="create-package-progress-fill"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <div className="create-package-progress-steps">
                {[
                  { number: 1, label: 'Basic Info' },
                  { number: 2, label: 'Dates & Capacity' },
                  { number: 3, label: 'Accommodation' },
                  { number: 4, label: 'Itinerary' },
                  { number: 5, label: 'Inclusions' },
                  { number: 6, label: 'Images' }
                ].map((step) => (
                  <div
                    key={step.number}
                    className={`create-package-progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
                  >
                    <span className="create-package-step-number">{step.number}</span>
                    <span className="create-package-step-label">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Form */}
            <form 
              onSubmit={handleSubmit} 
              className="create-package-form"
              onKeyDown={(e) => {
                // Prevent form submission on Enter key except on the final step
                if (e.key === 'Enter' && currentStep !== totalSteps) {
                  e.preventDefault();
                }
                // Also prevent form submission when Enter is pressed in textareas
                if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
                  e.stopPropagation();
                }
              }}
            >
              <div className="create-package-card">
                {error && (
                  <div className="create-package-error">
                    <div className="create-package-error-icon">
                      <Icon icon="exclamation-circle" />
                    </div>
                    <span className="create-package-error-text">{error}</span>
                  </div>
                )}

                {renderStepContent()}

                {/* Navigation */}
                <div className="create-package-navigation">
                  {currentStep > 1 && (
                    <button 
                      type="button" 
                      className="create-package-btn-secondary"
                      onClick={prevStep}
                    >
                      <Icon icon="arrow-left" />
                      <span>Previous</span>
                    </button>
                  )}

                  {currentStep < totalSteps ? (
                    <button 
                      type="button" 
                      className="create-package-btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextStep();
                      }}
                      disabled={!isStepValid()}
                    >
                      <span>Continue</span>
                      <Icon icon="arrow-right" />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="create-package-btn-primary" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="create-package-btn-loading">
                          <div className="create-package-loading-spinner"></div>
                          <span>Updating Package...</span>
                        </div>
                      ) : (
                        <div className="create-package-btn-content">
                          <span>Update Package</span>
                          <Icon icon="save" />
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}