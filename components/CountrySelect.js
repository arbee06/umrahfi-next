import { useState, useEffect, useRef } from 'react';
import { getCountries } from '@/utils/countries';
import Icon from '@/components/FontAwesome';

// Helper function to convert country code to flag emoji
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🏴';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

export default function CountrySelect({ 
  value, 
  onChange, 
  name, 
  placeholder = "Select your country",
  required = false,
  className = "",
  disabled = false 
}) {
  const [countries] = useState(() => 
    getCountries().map(country => ({
      ...country,
      flag: getFlagEmoji(country.code)
    }))
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Filter countries based on search term
    const filtered = countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, countries]);

  useEffect(() => {
    // Set search term to display the selected country name
    if (value) {
      const selectedCountry = countries.find(c => c.name === value);
      if (selectedCountry && !isOpen) {
        setSearchTerm(selectedCountry.name);
      }
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [value, countries, isOpen]);

  useEffect(() => {
    // Handle clicks outside component
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleCountrySelect = (country) => {
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: country.name
        }
      });
    }
    setSearchTerm(country.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setSearchTerm('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
          handleCountrySelect(filteredCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`country-select ${className}`} ref={dropdownRef}>
      <div className="country-select-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={className}
          autoComplete="country"
        />
        <div 
          className={`country-select-arrow ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <Icon icon="chevron-down" />
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="country-select-dropdown">
          {filteredCountries.length > 0 ? (
            <div className="country-select-options">
              {filteredCountries.map((country, index) => (
                <div
                  key={country.code}
                  className={`country-select-option ${
                    index === highlightedIndex ? 'highlighted' : ''
                  } ${value === country.name ? 'selected' : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="country-flag">{country.flag}</span>
                  <span className="country-name">{country.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="country-select-no-results">
              <Icon icon="search" />
              <span>No countries found for "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}