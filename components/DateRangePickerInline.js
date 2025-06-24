import { useState, useEffect } from 'react';
import Icon from '@/components/FontAwesome';

const DateRangePickerInline = ({ 
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
        
        // Auto-apply if duration is set
        setTimeout(() => {
          onDatesChange({
            departureDate: dateStr,
            returnDate: calculatedReturn.toISOString().split('T')[0]
          });
        }, 300);
      }
    } else {
      // Set return date
      setSelectedReturn(dateStr);
      onDatesChange({
        departureDate: selectedDeparture,
        returnDate: dateStr
      });
    }
  };

  const isDateDisabled = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Disable past dates
    if (dateStr < today) return true;
    
    // If departure is selected and duration is set, disable dates outside the range
    if (selectedDeparture && duration && !selectedReturn) {
      const departure = new Date(selectedDeparture);
      const maxReturn = new Date(departure);
      maxReturn.setDate(departure.getDate() + parseInt(duration) - 1);
      
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
      days.push(<div key={`empty-${i}`} className="date-picker-inline-day empty"></div>);
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
          disabled={isDisabled}
          className={`
            date-picker-inline-day
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

  return (
    <div className="date-range-picker-inline">
      <button
        type="button"
        className="date-range-picker-inline-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="date-range-picker-inline-icon">
          <Icon icon="calendar-alt" />
        </div>
        <div className="date-range-picker-inline-content">
          <span className="date-range-picker-inline-label">TRAVEL DATES</span>
          <div className="date-range-picker-inline-value">
            {selectedDeparture && selectedReturn ? (
              <>
                <span>{formatDate(selectedDeparture)}</span>
                <Icon icon="arrow-right" className="date-range-inline-arrow" />
                <span>{formatDate(selectedReturn)}</span>
              </>
            ) : (
              <span className="placeholder">Select departure and return dates</span>
            )}
          </div>
        </div>
        <Icon icon="chevron-down" className={`date-range-picker-inline-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="date-picker-inline-panel">
          {duration && (
            <div className="date-picker-inline-duration-info">
              <Icon icon="info-circle" />
              <span>Package duration: {duration} days</span>
            </div>
          )}

          <div className="date-picker-inline-calendar">
            <div className="date-picker-inline-calendar-header">
              <button type="button" onClick={() => navigateMonth(-1)} className="date-picker-inline-nav">
                <Icon icon="chevron-left" />
              </button>
              <h4 className="date-picker-inline-month">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button type="button" onClick={() => navigateMonth(1)} className="date-picker-inline-nav">
                <Icon icon="chevron-right" />
              </button>
            </div>

            <div className="date-picker-inline-weekdays">
              <div className="date-picker-inline-weekday">S</div>
              <div className="date-picker-inline-weekday">M</div>
              <div className="date-picker-inline-weekday">T</div>
              <div className="date-picker-inline-weekday">W</div>
              <div className="date-picker-inline-weekday">T</div>
              <div className="date-picker-inline-weekday">F</div>
              <div className="date-picker-inline-weekday">S</div>
            </div>

            <div className="date-picker-inline-days">
              {renderCalendar()}
            </div>
          </div>

          <div className="date-picker-inline-actions">
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }} 
              className="date-picker-inline-ok"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePickerInline;