import { useState, useEffect } from 'react';
import Icon from '@/components/FontAwesome';

const DateRangePicker = ({ 
  departureDate, 
  returnDate, 
  duration,
  onDatesChange,
  minDate = new Date().toISOString().split('T')[0]
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeparture, setSelectedDeparture] = useState(departureDate);
  const [selectedReturn, setSelectedReturn] = useState(returnDate);
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    // Auto-calculate return date when departure date changes based on duration
    if (selectedDeparture && duration) {
      const departure = new Date(selectedDeparture);
      const calculatedReturn = new Date(departure);
      calculatedReturn.setDate(departure.getDate() + parseInt(duration) - 1);
      setSelectedReturn(calculatedReturn.toISOString().split('T')[0]);
    }
  }, [selectedDeparture, duration]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (!selectedDeparture || (selectedDeparture && selectedReturn)) {
      // Start new selection
      setSelectedDeparture(dateStr);
      setSelectedReturn(null);
      
      // Auto-calculate return date based on duration
      if (duration) {
        const calculatedReturn = new Date(date);
        calculatedReturn.setDate(date.getDate() + parseInt(duration) - 1);
        setSelectedReturn(calculatedReturn.toISOString().split('T')[0]);
      }
    } else {
      // Set return date (already auto-calculated, but allow manual override if needed)
      setSelectedReturn(dateStr);
    }
  };

  const isDateDisabled = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Disable past dates
    if (dateStr < today) return true;
    
    // If departure is selected and duration is set, disable dates outside the range
    if (selectedDeparture && duration) {
      const departure = new Date(selectedDeparture);
      const maxReturn = new Date(departure);
      maxReturn.setDate(departure.getDate() + parseInt(duration) - 1);
      
      // For departure selection, no additional restrictions
      if (!selectedReturn) return false;
      
      // For return date selection, restrict to duration range
      return date < departure || date > maxReturn;
    }
    
    return false;
  };

  const isDateInRange = (date) => {
    if (!selectedDeparture || !selectedReturn) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= selectedDeparture && dateStr <= selectedReturn;
  };

  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDeparture || dateStr === selectedReturn;
  };

  const handleApply = () => {
    if (selectedDeparture && selectedReturn) {
      onDatesChange({
        departureDate: selectedDeparture,
        returnDate: selectedReturn
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDeparture('');
    setSelectedReturn('');
    onDatesChange({
      departureDate: '',
      returnDate: ''
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="date-picker-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      const isInRange = isDateInRange(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={isDisabled}
          className={`
            date-picker-day
            ${isDisabled ? 'disabled' : ''}
            ${isSelected ? 'selected' : ''}
            ${isInRange ? 'in-range' : ''}
            ${isToday ? 'today' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  // Position dropdown when it opens
  useEffect(() => {
    if (isOpen) {
      const button = document.querySelector('.date-range-picker-button');
      const dropdown = document.querySelector('.date-picker-dropdown');
      
      if (button && dropdown) {
        const rect = button.getBoundingClientRect();
        const dropdownHeight = dropdown.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate position
        let top = rect.bottom + 8;
        let left = rect.left;
        
        // Check if dropdown would go off bottom of screen
        if (top + dropdownHeight > windowHeight - 20) {
          // Position above the button instead
          top = rect.top - dropdownHeight - 8;
        }
        
        // Check if dropdown would go off right edge
        if (left + 500 > window.innerWidth) {
          left = window.innerWidth - 520;
        }
        
        // Apply positioning
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
      }
    }
  }, [isOpen]);

  return (
    <div className="date-range-picker">
      <button
        type="button"
        className="date-range-picker-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="date-range-picker-icon">
          <Icon icon="calendar-alt" />
        </div>
        <div className="date-range-picker-content">
          <span className="date-range-picker-label">Travel Dates</span>
          <div className="date-range-picker-value">
            {selectedDeparture && selectedReturn ? (
              <>
                <span>{formatDate(selectedDeparture)}</span>
                <Icon icon="arrow-right" className="date-range-arrow" />
                <span>{formatDate(selectedReturn)}</span>
              </>
            ) : (
              <span className="placeholder">Select departure and return dates</span>
            )}
          </div>
        </div>
        <Icon icon="chevron-down" className={`date-range-picker-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="date-picker-backdrop" onClick={() => setIsOpen(false)} />
          <div className="date-picker-dropdown">
            <div className="date-picker-header">
              <h3>Select your travel dates</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="date-picker-close">
                <Icon icon="times" />
              </button>
            </div>

            {duration && (
              <div className="date-picker-duration-info">
                <Icon icon="info-circle" />
                <span>Your package duration is {duration} days</span>
              </div>
            )}

            <div className="date-picker-calendar">
              <div className="date-picker-calendar-header">
                <button type="button" onClick={() => navigateMonth(-1)} className="date-picker-nav">
                  <Icon icon="chevron-left" />
                </button>
                <h4 className="date-picker-month">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <button type="button" onClick={() => navigateMonth(1)} className="date-picker-nav">
                  <Icon icon="chevron-right" />
                </button>
              </div>

              <div className="date-picker-weekdays">
                <div className="date-picker-weekday">SUN</div>
                <div className="date-picker-weekday">MON</div>
                <div className="date-picker-weekday">TUE</div>
                <div className="date-picker-weekday">WED</div>
                <div className="date-picker-weekday">THU</div>
                <div className="date-picker-weekday">FRI</div>
                <div className="date-picker-weekday">SAT</div>
              </div>

              <div className="date-picker-days">
                {renderCalendar()}
              </div>
            </div>

            {selectedDeparture && selectedReturn && (
              <div className="date-picker-selected-dates">
                <div className="date-picker-selected-item">
                  <span className="label">Departure</span>
                  <span className="date">{formatDate(selectedDeparture)}</span>
                </div>
                <Icon icon="plane" className="date-picker-plane-icon" />
                <div className="date-picker-selected-item">
                  <span className="label">Return</span>
                  <span className="date">{formatDate(selectedReturn)}</span>
                </div>
              </div>
            )}

            <div className="date-picker-actions">
              <button type="button" onClick={handleClear} className="date-picker-clear">
                Clear
              </button>
              <button 
                type="button" 
                onClick={handleApply} 
                className="date-picker-apply"
                disabled={!selectedDeparture || !selectedReturn}
              >
                Apply Dates
              </button>
            </div>

            <div className="date-picker-suggestions">
              <button type="button" className="date-picker-suggestion" onClick={() => {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                handleDateClick(nextMonth);
              }}>
                Next Month ({duration || 7} days)
              </button>
              <button type="button" className="date-picker-suggestion" onClick={() => {
                const inTwoMonths = new Date();
                inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);
                handleDateClick(inTwoMonths);
              }}>
                In 2 Months ({duration || 7} days)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;