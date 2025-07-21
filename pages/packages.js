import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import packageService from '@/services/packageService';
import { getAirports, getAirportByCode } from '@/utils/airports';
import { getCountries } from '@/utils/countries';
import Icon from '@/components/FontAwesome';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('packages'); // 'packages' or 'companies'
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    country: '',
    departureAirport: '',
    arrivalAirport: '',
    guests: '1'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [airports] = useState(() => getAirports());
  const [countries] = useState(() => getCountries());
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({});

  useEffect(() => {
    if (viewMode === 'packages') {
      fetchPackages();
    } else {
      fetchCompanies();
    }
  }, [viewMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside any dropdown or filter button
      if (!e.target.closest('.packages-modern-filter-item') && 
          !e.target.closest('.packages-modern-filter-dropdown')) {
        setActiveFilter(null);
        setShowDatePicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchPackages = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await packageService.getPackages(filterParams);
      setPackages(response.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/browse/companies', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      } else {
        console.error('Failed to fetch companies:', response.status);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const applyFilters = () => {
    const filterParams = {};
    if (filters.minPrice) filterParams.minPrice = filters.minPrice;
    if (filters.maxPrice) filterParams.maxPrice = filters.maxPrice;
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;
    if (filters.country) filterParams.country = filters.country;
    if (filters.departureAirport) filterParams.departureAirport = filters.departureAirport;
    if (filters.arrivalAirport) filterParams.arrivalAirport = filters.arrivalAirport;
    if (filters.guests) filterParams.guests = filters.guests;
    
    if (viewMode === 'packages') {
      fetchPackages(filterParams);
    } else {
      fetchCompanies(filterParams);
    }
    setActiveFilter(null);
    setShowDatePicker(false);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      country: '',
      departureAirport: '',
      arrivalAirport: '',
      guests: '1'
    });
    if (viewMode === 'packages') {
      fetchPackages();
    } else {
      fetchCompanies();
    }
    setActiveFilter(null);
    setShowDatePicker(false);
  };

  const handleDatePickerToggle = () => {
    setShowDatePicker(!showDatePicker);
    setActiveFilter(null);
    // Initialize selected dates from filters
    if (!showDatePicker) {
      setSelectedDates({
        start: filters.startDate ? new Date(filters.startDate) : null,
        end: filters.endDate ? new Date(filters.endDate) : null
      });
    }
  };

  const handleFilterToggle = (filterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
    setShowDatePicker(false);
  };

  // Custom date picker functions
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Get first day of week (0 = Sunday)
    const startDay = firstDay.getDay();
    
    // Add days from previous month to fill the week
    startDate.setDate(startDate.getDate() - startDay);
    
    // Add days from next month to fill the week
    const endDay = lastDay.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDay));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isDateInRange = (date, start, end) => {
    if (!start || !end || !date) return false;
    return date >= start && date <= end;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      // Start new selection
      setSelectedDates({ start: date, end: null });
    } else if (selectedDates.start && !selectedDates.end) {
      // Complete the range
      if (date < selectedDates.start) {
        setSelectedDates({ start: date, end: selectedDates.start });
      } else {
        setSelectedDates({ start: selectedDates.start, end: date });
      }
    }
  };

  const applyDateSelection = () => {
    setFilters({
      ...filters,
      startDate: selectedDates.start ? formatDateForInput(selectedDates.start) : '',
      endDate: selectedDates.end ? formatDateForInput(selectedDates.end) : ''
    });
    setShowDatePicker(false);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getMonthYear = () => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getAvailabilityStatus = (availableSeats, totalSeats) => {
    const percentage = (availableSeats / totalSeats) * 100;
    if (percentage === 0) return { status: 'sold-out', text: 'Sold Out', color: 'text-error' };
    if (percentage <= 20) return { status: 'low', text: 'Few Spots Left', color: 'text-warning' };
    if (percentage <= 50) return { status: 'medium', text: 'Limited Spots', color: 'text-primary' };
    return { status: 'high', text: 'Available', color: 'text-success' };
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon 
        key={i} 
        icon="star" 
        className={`packages-star ${i < rating ? 'filled' : 'empty'}`}
      />
    ));
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'guests' && value !== '' && value !== '1'
  );

  const handlePhotoNavigation = (packageId, direction) => {
    const pkg = packages.find(p => p.id === packageId);
    const photos = getPackagePhotos(pkg);
    
    const currentIndex = currentPhotoIndex[packageId] || 0;
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex >= photos.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex <= 0 ? photos.length - 1 : currentIndex - 1;
    }
    
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [packageId]: newIndex
    }));
  };

  const hasActualPhotos = (pkg) => {
    return (pkg.photos && pkg.photos.length > 0) || (pkg.images && pkg.images.length > 0);
  };

  const getCurrentPhoto = (pkg) => {
    if (!hasActualPhotos(pkg)) {
      return null; // No photo available
    }
    
    const photos = getPackagePhotos(pkg);
    const currentIndex = currentPhotoIndex[pkg.id] || 0;
    return photos[currentIndex];
  };

  const getPackagePhotos = (pkg) => {
    // Use actual package images/photos from database
    if (pkg.photos && pkg.photos.length > 0) {
      return pkg.photos;
    }
    
    if (pkg.images && pkg.images.length > 0) {
      return pkg.images;
    }
    
    return [];
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="packages-hero-section">
        <div className="packages-hero-content">
          <div className="packages-hero-text">
            <h1 className="packages-hero-title">Discover Sacred Journeys</h1>
            <p className="packages-hero-subtitle">
              Embark on a spiritual journey with our carefully curated Umrah packages. 
              Experience comfort, guidance, and devotion in the holy cities.
            </p>
          </div>
        </div>
      </div>

      <div className="packages-main-content">
        {/* Modern Filter Section */}
        <div className="packages-modern-filter-section">
          <div className="packages-modern-filter-container">
            <div className="packages-modern-filter-grid">
              
              {/* Travel Dates Filter */}
              <div className="packages-modern-filter-item">
                <button
                  onClick={handleDatePickerToggle}
                  className={`packages-modern-filter-button ${(filters.startDate || filters.endDate) ? 'active' : ''}`}
                >
                  <div className={`packages-modern-filter-icon-wrapper ${(filters.startDate || filters.endDate) ? 'active' : ''}`}>
                    <Icon icon="calendar-alt" className="packages-modern-filter-icon" />
                  </div>
                  <div className="packages-modern-filter-content">
                    <span className="packages-modern-filter-label">Travel Dates</span>
                    <span className="packages-modern-filter-value">
                      {filters.startDate && filters.endDate 
                        ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
                        : filters.startDate 
                        ? `From ${formatDate(filters.startDate)}`
                        : 'Select dates'}
                    </span>
                  </div>
                  <Icon 
                    icon="chevron-down" 
                    className={`packages-modern-filter-chevron ${showDatePicker ? 'rotate' : ''}`} 
                  />
                </button>
                
                {showDatePicker && (
                  <div className="packages-modern-filter-dropdown packages-modern-date-dropdown">
                    <div className="packages-modern-dropdown-header">
                      <h3>Select your travel dates</h3>
                      <button 
                        className="packages-modern-dropdown-close"
                        onClick={() => setShowDatePicker(false)}
                      >
                        <Icon icon="times" />
                      </button>
                    </div>
                    
                    {/* Custom Calendar */}
                    <div className="packages-modern-calendar">
                      <div className="packages-modern-calendar-header">
                        <button 
                          onClick={() => navigateMonth(-1)}
                          className="packages-modern-calendar-nav"
                        >
                          <Icon icon="chevron-left" />
                        </button>
                        <span className="packages-modern-calendar-month">{getMonthYear()}</span>
                        <button 
                          onClick={() => navigateMonth(1)}
                          className="packages-modern-calendar-nav"
                        >
                          <Icon icon="chevron-right" />
                        </button>
                      </div>
                      
                      <div className="packages-modern-calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="packages-modern-calendar-weekday">{day}</div>
                        ))}
                      </div>
                      
                      <div className="packages-modern-calendar-days">
                        {generateCalendarDays().map((date, index) => {
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                          const isToday = isSameDay(date, new Date());
                          const isStart = isSameDay(date, selectedDates.start);
                          const isEnd = isSameDay(date, selectedDates.end);
                          const isInRange = isDateInRange(date, selectedDates.start, selectedDates.end);
                          const isDisabled = isDateDisabled(date);
                          
                          return (
                            <button
                              key={index}
                              onClick={() => handleDateClick(date)}
                              disabled={isDisabled}
                              className={`packages-modern-calendar-day ${
                                !isCurrentMonth ? 'other-month' : ''
                              } ${isToday ? 'today' : ''} ${
                                isStart || isEnd ? 'selected' : ''
                              } ${isInRange ? 'in-range' : ''} ${
                                isDisabled ? 'disabled' : ''
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Selected dates display */}
                      {(selectedDates.start || selectedDates.end) && (
                        <div className="packages-modern-selected-dates">
                          <div className="packages-modern-selected-date-item">
                            <span className="label">Departure:</span>
                            <span className="date">
                              {selectedDates.start ? selectedDates.start.toLocaleDateString() : 'Select date'}
                            </span>
                          </div>
                          <Icon icon="arrow-right" />
                          <div className="packages-modern-selected-date-item">
                            <span className="label">Return:</span>
                            <span className="date">
                              {selectedDates.end ? selectedDates.end.toLocaleDateString() : 'Select date'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="packages-modern-calendar-actions">
                        <button
                          onClick={() => setSelectedDates({ start: null, end: null })}
                          className="packages-modern-calendar-clear"
                        >
                          Clear
                        </button>
                        <button
                          onClick={applyDateSelection}
                          disabled={!selectedDates.start}
                          className="packages-modern-calendar-apply"
                        >
                          Apply Dates
                        </button>
                      </div>
                    </div>
                    
                    <div className="packages-modern-suggestions">
                      <button 
                        className="packages-modern-suggestion-btn"
                        onClick={() => {
                          const start = new Date();
                          start.setDate(start.getDate() + 30);
                          const end = new Date(start);
                          end.setDate(end.getDate() + 14);
                          setSelectedDates({ start, end });
                          setFilters({
                            ...filters,
                            startDate: formatDateForInput(start),
                            endDate: formatDateForInput(end)
                          });
                          setShowDatePicker(false);
                        }}
                      >
                        Next Month (14 days)
                      </button>
                      <button 
                        className="packages-modern-suggestion-btn"
                        onClick={() => {
                          const start = new Date();
                          start.setDate(start.getDate() + 60);
                          const end = new Date(start);
                          end.setDate(end.getDate() + 10);
                          setSelectedDates({ start, end });
                          setFilters({
                            ...filters,
                            startDate: formatDateForInput(start),
                            endDate: formatDateForInput(end)
                          });
                          setShowDatePicker(false);
                        }}
                      >
                        In 2 Months (10 days)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Range Filter - FIXED */}
              <div className="packages-modern-filter-item">
                <button
                  onClick={() => handleFilterToggle('price')}
                  className={`packages-modern-filter-button ${(filters.minPrice || filters.maxPrice) ? 'active' : ''}`}
                >
                  <div className={`packages-modern-filter-icon-wrapper ${(filters.minPrice || filters.maxPrice) ? 'active' : ''}`}>
                    <Icon icon="dollar-sign" className="packages-modern-filter-icon" />
                  </div>
                  <div className="packages-modern-filter-content">
                    <span className="packages-modern-filter-label">Price Range</span>
                    <span className="packages-modern-filter-value">
                      {filters.minPrice || filters.maxPrice 
                        ? `${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}`
                        : 'Any price'}
                    </span>
                  </div>
                  <Icon 
                    icon="chevron-down" 
                    className={`packages-modern-filter-chevron ${activeFilter === 'price' ? 'rotate' : ''}`} 
                  />
                </button>
                
                {activeFilter === 'price' && (
                  <div className="packages-modern-filter-dropdown">
                    <div className="packages-modern-dropdown-header">
                      <h3>Set your budget</h3>
                      <button 
                        className="packages-modern-dropdown-close"
                        onClick={() => setActiveFilter(null)}
                      >
                        <Icon icon="times" />
                      </button>
                    </div>
                    
                    <div className="packages-modern-price-inputs">
                      <div className="packages-modern-input-group">
                        <label>Min Price</label>
                        <div className="packages-modern-price-wrapper">
                          <span className="packages-modern-price-prefix">$</span>
                          <input
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                            placeholder="0"
                            className="packages-modern-price-input"
                          />
                        </div>
                      </div>
                      <div className="packages-modern-input-group">
                        <label>Max Price</label>
                        <div className="packages-modern-price-wrapper">
                          <span className="packages-modern-price-prefix">$</span>
                          <input
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                            placeholder="10,000"
                            className="packages-modern-price-input"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="packages-modern-suggestions">
                      <button 
                        className="packages-modern-suggestion-btn"
                        onClick={() => setFilters({...filters, minPrice: '0', maxPrice: '1500'})}
                      >
                        Budget
                      </button>
                      <button 
                        className="packages-modern-suggestion-btn"
                        onClick={() => setFilters({...filters, minPrice: '1500', maxPrice: '3000'})}
                      >
                        Standard
                      </button>
                      <button 
                        className="packages-modern-suggestion-btn"
                        onClick={() => setFilters({...filters, minPrice: '3000', maxPrice: ''})}
                      >
                        Premium
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div className="packages-modern-filter-item">
                <button
                  onClick={() => handleFilterToggle('location')}
                  className={`packages-modern-filter-button ${(filters.country || filters.departureAirport || filters.arrivalAirport) ? 'active' : ''}`}
                >
                  <div className={`packages-modern-filter-icon-wrapper ${(filters.country || filters.departureAirport || filters.arrivalAirport) ? 'active' : ''}`}>
                    <Icon icon="map-marker-alt" className="packages-modern-filter-icon" />
                  </div>
                  <div className="packages-modern-filter-content">
                    <span className="packages-modern-filter-label">Location</span>
                    <span className="packages-modern-filter-value">
                      {filters.country || filters.departureAirport || filters.arrivalAirport 
                        ? `${filters.country || 'Any'} ${filters.departureAirport ? `• ${filters.departureAirport}` : ''}`
                        : 'All locations'}
                    </span>
                  </div>
                  <Icon 
                    icon="chevron-down" 
                    className={`packages-modern-filter-chevron ${activeFilter === 'location' ? 'rotate' : ''}`} 
                  />
                </button>
                
                {activeFilter === 'location' && (
                  <div className="packages-modern-filter-dropdown packages-modern-location-dropdown">
                    <div className="packages-modern-dropdown-header">
                      <h3>Choose your location</h3>
                      <button 
                        className="packages-modern-dropdown-close"
                        onClick={() => setActiveFilter(null)}
                      >
                        <Icon icon="times" />
                      </button>
                    </div>
                    
                    <div className="packages-modern-input-group">
                      <label>Country</label>
                      <select
                        value={filters.country}
                        onChange={(e) => setFilters({...filters, country: e.target.value})}
                        className="packages-modern-select"
                      >
                        <option value="">All Countries</option>
                        {countries.map(country => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="packages-modern-input-group">
                      <label>Departure From</label>
                      <select
                        value={filters.departureAirport}
                        onChange={(e) => setFilters({...filters, departureAirport: e.target.value})}
                        className="packages-modern-select"
                      >
                        <option value="">Any Airport</option>
                        {airports.map(airport => (
                          <option key={airport.iata} value={airport.iata}>
                            {airport.iata} - {airport.city}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="packages-modern-input-group">
                      <label>Arrival To</label>
                      <select
                        value={filters.arrivalAirport}
                        onChange={(e) => setFilters({...filters, arrivalAirport: e.target.value})}
                        className="packages-modern-select"
                      >
                        <option value="">Any Airport</option>
                        {airports.filter(airport => ['JED', 'RUH', 'DMM', 'MED'].includes(airport.iata)).map(airport => (
                          <option key={airport.iata} value={airport.iata}>
                            {airport.iata} - {airport.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Guests Filter */}
              <div className="packages-modern-filter-item">
                <button
                  onClick={() => handleFilterToggle('guests')}
                  className={`packages-modern-filter-button ${filters.guests !== '1' ? 'active' : ''}`}
                >
                  <div className={`packages-modern-filter-icon-wrapper ${filters.guests !== '1' ? 'active' : ''}`}>
                    <Icon icon="users" className="packages-modern-filter-icon" />
                  </div>
                  <div className="packages-modern-filter-content">
                    <span className="packages-modern-filter-label">Guests</span>
                    <span className="packages-modern-filter-value">
                      {filters.guests} {filters.guests === '1' ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  <Icon 
                    icon="chevron-down" 
                    className={`packages-modern-filter-chevron ${activeFilter === 'guests' ? 'rotate' : ''}`} 
                  />
                </button>

                {activeFilter === 'guests' && (
                  <div className="packages-modern-filter-dropdown">
                    <div className="packages-modern-dropdown-header">
                      <h3>Number of guests</h3>
                      <button 
                        className="packages-modern-dropdown-close"
                        onClick={() => setActiveFilter(null)}
                      >
                        <Icon icon="times" />
                      </button>
                    </div>
                    
                    <div className="packages-modern-guests-grid">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <button
                          key={num}
                          onClick={() => setFilters({...filters, guests: num.toString()})}
                          className={`packages-modern-guest-btn ${filters.guests === num.toString() ? 'active' : ''}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="packages-modern-filter-actions">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="packages-modern-clear-btn"
              >
                <Icon icon="times-circle" />
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="packages-modern-search-btn"
              >
                <Icon icon="search" />
                Search Packages
              </button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="packages-modern-active-filters">
                <div className="packages-modern-active-filters-label">Active Filters:</div>
                <div className="packages-modern-active-filters-list">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || key === 'guests' || value === '1') return null;
                    
                    let displayValue = value;
                    if (key === 'startDate' || key === 'endDate') {
                      displayValue = formatDate(value);
                    }
                    
                    return (
                      <span key={key} className="packages-modern-filter-tag">
                        {displayValue}
                        <button
                          onClick={() => setFilters({...filters, [key]: ''})}
                          className="packages-modern-filter-tag-remove"
                        >
                          <Icon icon="times" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Packages Section */}
        <div className="packages-packages-section">
          {loading ? (
            <div className="packages-loading-state">
              <Icon icon="spinner" spin className="packages-loading-spinner" />
              <p>Finding the perfect packages for you...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="packages-empty-state">
              <Icon icon="kaaba" className="packages-empty-icon" />
              <h3>No packages found</h3>
              <p>Try adjusting your filters or check back later for new packages.</p>
              <button onClick={clearFilters} className="btn btn-primary">
                View All Packages
              </button>
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="packages-view-toggle">
                <div className="packages-view-toggle-container">
                  <button 
                    className={`packages-view-toggle-btn ${viewMode === 'packages' ? 'active' : ''}`}
                    onClick={() => setViewMode('packages')}
                  >
                    <Icon icon={['fas', 'box']} />
                    <span>Packages</span>
                  </button>
                  <button 
                    className={`packages-view-toggle-btn ${viewMode === 'companies' ? 'active' : ''}`}
                    onClick={() => setViewMode('companies')}
                  >
                    <Icon icon={['fas', 'building']} />
                    <span>Companies</span>
                  </button>
                </div>
              </div>

              <div className="packages-packages-header">
                <h2>{viewMode === 'packages' ? 'Available Packages' : 'Travel Companies'}</h2>
                <span className="packages-packages-count">
                  {viewMode === 'packages' 
                    ? `${packages.length} packages found` 
                    : `${companies.length} companies found`}
                </span>
              </div>
              
              <div className="packages-packages-modern-grid">
                {viewMode === 'packages' ? packages.map((pkg) => {
                  const availability = getAvailabilityStatus(pkg.availableSeats, pkg.totalSeats);
                  
                  return (
                    <div key={pkg.id} className="packages-modern-card">
                      {/* Photo Section */}
                      <div className="packages-modern-photo-section">
                        <div className="packages-modern-photo-container">
                          <div className="packages-modern-photo-slideshow">
                            {hasActualPhotos(pkg) ? (
                              <>
                                <img 
                                  src={getCurrentPhoto(pkg)} 
                                  alt={pkg.title}
                                  className="packages-modern-photo-main"
                                  onClick={() => handlePhotoNavigation(pkg.id, 'next')}
                                />
                                {getPackagePhotos(pkg).length > 1 && (
                                  <>
                                    <button 
                                      className="packages-modern-photo-nav packages-modern-photo-prev"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePhotoNavigation(pkg.id, 'prev');
                                      }}
                                    >
                                      <Icon icon={['fas', 'chevron-left']} />
                                    </button>
                                    <button 
                                      className="packages-modern-photo-nav packages-modern-photo-next"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePhotoNavigation(pkg.id, 'next');
                                      }}
                                    >
                                      <Icon icon={['fas', 'chevron-right']} />
                                    </button>
                                    <div className="packages-modern-photo-indicators">
                                      {getPackagePhotos(pkg).slice(0, 3).map((_, index) => (
                                        <div 
                                          key={index} 
                                          className={`packages-modern-photo-dot ${index === (currentPhotoIndex[pkg.id] || 0) ? 'active' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIndex(prev => ({...prev, [pkg.id]: index}));
                                          }}
                                        />
                                      ))}
                                      {getPackagePhotos(pkg).length > 3 && (
                                        <span className="packages-modern-photo-count">+{getPackagePhotos(pkg).length - 3}</span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="packages-modern-photo-placeholder">
                                <Icon icon={['fas', 'image']} className="packages-placeholder-icon" />
                                <span className="packages-placeholder-text">Photo not available</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Package Badges */}
                        <div className="packages-modern-badges">
                          <span className="packages-modern-badge packages-modern-badge-type">
                            {pkg.price <= 1500 ? 'Economy' : pkg.price >= 4000 ? 'Luxury' : 'Premium'}
                          </span>
                          {pkg.isAllInclusive && (
                            <span className="packages-modern-badge packages-modern-badge-inclusive">
                              All-inclusive package
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="packages-modern-content">
                        {/* Top Content */}
                        <div className="packages-modern-content-top">
                          <div className="packages-modern-header">
                            <Link href={`/packages/${pkg.id}`} className="packages-modern-title-link">
                              <h3 className="packages-modern-title">{pkg.title}</h3>
                            </Link>
                            <div className="packages-modern-location">
                              <Icon icon={['fas', 'map-marker-alt']} />
                              <span>{pkg.country || 'Saudi Arabia'}</span>
                            </div>
                          </div>

                          {/* Company Info */}
                          <div className="packages-modern-company">
                            <div className="packages-modern-company-info">
                              <Icon icon={['fas', 'star']} className="packages-modern-rating-icon" />
                              <span className="packages-modern-rating">{pkg.companyRating || 'No rating'}</span>
                              <span className="packages-modern-company-name">
                                {pkg.companyName || 'Travel Company'}
                              </span>
                            </div>
                            {pkg.isGuideIncluded && (
                              <div className="packages-modern-features">
                                <span className="packages-modern-feature">
                                  <Icon icon={['fas', 'user-tie']} />
                                  Ziarah & Umrah Guide Optional
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Package Details */}
                          <div className="packages-modern-details">
                            <div className="packages-modern-detail-item">
                              <Icon icon={['fas', 'clock']} />
                              <span>{pkg.duration} days</span>
                            </div>
                            <div className="packages-modern-detail-item">
                              <Icon icon={['fas', 'calendar']} />
                              <span>{formatDate(pkg.departureDate)}</span>
                            </div>
                            <div className="packages-modern-detail-item">
                              <Icon icon={['fas', 'users']} />
                              <span>{pkg.availableSeats}/{pkg.totalSeats} seats</span>
                            </div>
                            <div className="packages-modern-detail-item">
                              <Icon icon={['fas', 'plane']} />
                              <span>{pkg.transportation || 'Flight'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Flight Information - Modern & Sleek */}
                        {(pkg.departureAirports?.length > 0 || pkg.airline) && (
                          <div className="packages-modern-flight-section">
                            <div className="packages-modern-flight-header">
                              <Icon icon={['fas', 'plane']} />
                              <span>Flight Details</span>
                            </div>
                            <div className="packages-modern-flight-content">
                              {pkg.departureAirports?.length > 0 && (
                                <div className="packages-modern-flight-item">
                                  <div className="packages-modern-flight-label">
                                    <Icon icon={['fas', 'plane-departure']} />
                                    <span>Departure</span>
                                  </div>
                                  <div className="packages-modern-flight-value">
                                    {pkg.departureAirports.slice(0, 2).join(', ')}
                                    {pkg.departureAirports.length > 2 && (
                                      <span className="packages-modern-extra-count">+{pkg.departureAirports.length - 2} more</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {pkg.airline && (
                                <div className="packages-modern-flight-item">
                                  <div className="packages-modern-flight-label">
                                    <Icon icon={['fas', 'building']} />
                                    <span>Airlines</span>
                                  </div>
                                  <div className="packages-modern-flight-value">
                                    {pkg.airline}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price and Actions Section */}
                      <div className="packages-modern-sidebar">
                        {/* Nights Breakdown - Improved Layout */}
                        <div className="packages-modern-nights-breakdown">
                          <div className="packages-modern-nights-header">
                            <Icon icon={['fas', 'bed']} />
                            <span>Accommodation</span>
                          </div>
                          <div className="packages-modern-nights-content">
                            {pkg.makkahDays > 0 && (
                              <div className="packages-modern-night-item">
                                <div className="packages-modern-city-info">
                                  <span className="packages-modern-city-name">Makkah</span>
                                  <span className="packages-modern-night-count">{pkg.makkahDays} Nights</span>
                                </div>
                                {pkg.makkahHotels?.[0] && (
                                  <div className="packages-modern-hotel-info">
                                    <span className="packages-modern-hotel-name">{pkg.makkahHotels[0].name}</span>
                                    <div className="packages-modern-hotel-rating">
                                      {Array.from({ length: pkg.makkahHotels[0].rating || 3 }, (_, i) => (
                                        <Icon key={i} icon={['fas', 'star']} className="packages-star-small" />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {pkg.madinaDays > 0 && (
                              <div className="packages-modern-night-item">
                                <div className="packages-modern-city-info">
                                  <span className="packages-modern-city-name">Madinah</span>
                                  <span className="packages-modern-night-count">{pkg.madinaDays} Nights</span>
                                </div>
                                {pkg.madinahHotels?.[0] && (
                                  <div className="packages-modern-hotel-info">
                                    <span className="packages-modern-hotel-name">{pkg.madinahHotels[0].name}</span>
                                    <div className="packages-modern-hotel-rating">
                                      {Array.from({ length: pkg.madinahHotels[0].rating || 3 }, (_, i) => (
                                        <Icon key={i} icon={['fas', 'star']} className="packages-star-small" />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="packages-modern-pricing">
                          <div className="packages-modern-price-main">
                            <span className="packages-modern-price-currency">$</span>
                            <span className="packages-modern-price-amount">{formatPrice(pkg.price).replace('$', '')}</span>
                          </div>
                        </div>

                        <Link href={`/packages/${pkg.id}`}>
                          <button className="packages-modern-customize-btn">
                            See details
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                }) : companies.map((company) => (
                  <div key={company.id} className="packages-company-card" onClick={() => handleCompanyClick(company)}>
                    <div className="packages-company-header">
                      <div className="packages-company-info">
                        <h3 className="packages-company-name">{company.name}</h3>
                        <div className="packages-company-badges">
                          {company.isVerified && (
                            <span className="packages-badge packages-badge-verified">
                              <Icon icon={['fas', 'check-circle']} />
                              Verified
                            </span>
                          )}
                          <span className="packages-badge packages-badge-plan">
                            <Icon icon={['fas', 'crown']} />
                            {company.subscriptionPlan?.charAt(0).toUpperCase() + company.subscriptionPlan?.slice(1) || 'Free'}
                          </span>
                        </div>
                      </div>
                      <div className="packages-company-avatar">
                        {company.profilePicture ? (
                          <img src={company.profilePicture} alt={company.name} />
                        ) : (
                          <Icon icon={['fas', 'building']} />
                        )}
                      </div>
                    </div>

                    <div className="packages-company-content">
                      <div className="packages-company-stats">
                        <div className="packages-company-stat">
                          <Icon icon={['fas', 'box']} />
                          <span className="packages-stat-number">{company.packageCount || 0}</span>
                          <span className="packages-stat-label">Packages</span>
                        </div>
                        <div className="packages-company-stat">
                          <Icon icon={['fas', 'star']} />
                          <span className="packages-stat-number">{company.avgRating || 'N/A'}</span>
                          <span className="packages-stat-label">Rating</span>
                        </div>
                        <div className="packages-company-stat">
                          <Icon icon={['fas', 'calendar']} />
                          <span className="packages-stat-number">{new Date(company.joinedDate).getFullYear()}</span>
                          <span className="packages-stat-label">Since</span>
                        </div>
                      </div>

                      <div className="packages-company-details">
                        <div className="packages-company-detail">
                          <Icon icon={['fas', 'envelope']} />
                          <span>{company.email}</span>
                        </div>
                        {company.phone && (
                          <div className="packages-company-detail">
                            <Icon icon={['fas', 'phone']} />
                            <span>{company.phone}</span>
                          </div>
                        )}
                        {company.address && (
                          <div className="packages-company-detail">
                            <Icon icon={['fas', 'map-marker-alt']} />
                            <span>{company.address}</span>
                          </div>
                        )}
                      </div>

                      {company.recentPackages && company.recentPackages.length > 0 && (
                        <div className="packages-company-recent">
                          <h4>Recent Packages</h4>
                          <div className="packages-company-recent-list">
                            {company.recentPackages.slice(0, 3).map((pkg) => (
                              <div key={pkg.id} className="packages-company-recent-item">
                                <span className="packages-recent-title">{pkg.title}</span>
                                <span className="packages-recent-price">${pkg.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="packages-company-footer">
                      <button className="btn btn-primary packages-company-cta">
                        View Company Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Company Details Modal */}
      <CompanyDetailsModal 
        company={selectedCompany}
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          setSelectedCompany(null);
        }}
      />
    </Layout>
  );
}