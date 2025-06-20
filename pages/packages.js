import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import packageService from '@/services/packageService';
import { getAirports, getAirportByCode } from '@/utils/airports';
import { getCountries } from '@/utils/countries';
import Icon from '@/components/FontAwesome';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchPackages();
  }, []);

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
    
    fetchPackages(filterParams);
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
    fetchPackages();
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
              <div className="packages-packages-header">
                <h2>Available Packages</h2>
                <span className="packages-packages-count">{packages.length} packages found</span>
              </div>
              
              <div className="packages-packages-grid">
                {packages.map((pkg) => {
                  const availability = getAvailabilityStatus(pkg.availableSeats, pkg.totalSeats);
                  
                  return (
                    <div key={pkg.id} className="packages-package-card">
                      <div className="packages-package-header">
                        <div className="packages-package-badge">
                          {pkg.price <= 1500 ? 'Economy' : pkg.price >= 4000 ? 'Luxury' : 'Premium'}
                        </div>
                        <div className={`packages-availability-badge ${availability.status}`}>
                          {availability.text}
                        </div>
                      </div>

                      <div className="packages-package-content">
                        <h3 className="packages-package-title">{pkg.title}</h3>
                        <p className="packages-package-description">{pkg.description}</p>

                        <div className="packages-package-price">
                          <span className="packages-price-label">Starting from</span>
                          <div className="packages-price-wrapper">
                            <div className="packages-price-item">
                              <span className="packages-price-value">{formatPrice(pkg.price)}</span>
                              <span className="packages-price-period">per adult</span>
                            </div>
                            {pkg.childPrice > 0 && (
                              <div className="packages-price-item packages-price-child">
                                <span className="packages-price-value">{formatPrice(pkg.childPrice)}</span>
                                <span className="packages-price-period">per child</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="packages-package-details">
                          <div className="packages-detail-item">
                            <Icon icon="clock" className="packages-detail-icon" />
                            <div className="packages-detail-content">
                              <span className="packages-detail-label">Duration</span>
                              <span className="packages-detail-value">{pkg.duration} days</span>
                            </div>
                          </div>

                          <div className="packages-detail-item">
                            <Icon icon="plane" className="packages-detail-icon" />
                            <div className="packages-detail-content">
                              <span className="packages-detail-label">Departure</span>
                              <span className="packages-detail-value">{formatDate(pkg.departureDate)}</span>
                            </div>
                          </div>

                          <div className="packages-detail-item">
                            <Icon icon="users" className="packages-detail-icon" />
                            <div className="packages-detail-content">
                              <span className="packages-detail-label">Available Seats</span>
                              <span className="packages-detail-value">{pkg.availableSeats}/{pkg.totalSeats}</span>
                            </div>
                          </div>

                          <div className="packages-detail-item">
                            <Icon icon="globe" className="packages-detail-icon" />
                            <div className="packages-detail-content">
                              <span className="packages-detail-label">Country</span>
                              <span className="packages-detail-value">{pkg.country}</span>
                            </div>
                          </div>

                          {(pkg.departureAirport || pkg.arrivalAirport) && (
                            <div className="packages-detail-item">
                              <Icon icon="route" className="packages-detail-icon" />
                              <div className="packages-detail-content">
                                <span className="packages-detail-label">Route</span>
                                <span className="packages-detail-value">
                                  {pkg.departureAirport && getAirportByCode(pkg.departureAirport) ? 
                                    `${pkg.departureAirport} (${getAirportByCode(pkg.departureAirport).city})` : 
                                    pkg.departureAirport || 'Various'
                                  } 
                                  {pkg.transitAirport && ` → ${pkg.transitAirport}`}
                                  {pkg.arrivalAirport && ` → ${pkg.arrivalAirport} (${getAirportByCode(pkg.arrivalAirport)?.city || 'Saudi Arabia'})`}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="packages-detail-item">
                            <Icon icon="hotel" className="packages-detail-icon" />
                            <div className="packages-detail-content">
                              <span className="packages-detail-label">Hotel</span>
                              <div className="packages-hotel-info">
                                <span className="packages-hotel-name">{pkg.hotelName}</span>
                                <div className="packages-hotel-rating">
                                  {renderStars(pkg.hotelRating)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="packages-package-footer">
                        <Link href={`/packages/${pkg.id}`}>
                          <button className="btn btn-primary packages-package-cta">
                            View Details & Book
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}