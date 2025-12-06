import React, { useState, useRef, useEffect } from 'react';
import './MultiSelectAutocomplete.css';

export default function MultiSelectAutocomplete({
  label,
  value = [], // Array of selected IDs
  onChange, // Function that receives array of IDs
  options = [], // Array of { id, name, ... } or { value, label, ... }
  placeholder = 'Type to search...',
  emptyMessage = 'No options available',
  getOptionLabel = (option) => option.name || option.label || String(option),
  getOptionValue = (option) => option.id || option.value || option,
  getOptionDisplay = (option) => {
    if (option.name && option.role) {
      return `${option.name} (${option.role})`;
    }
    return option.name || option.label || String(option);
  }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize value to array of strings
  const selectedIds = Array.isArray(value) ? value.map(v => String(v)) : [];

  // Get selected options
  const selectedOptions = options.filter(opt => {
    const optValue = String(getOptionValue(opt));
    return selectedIds.includes(optValue);
  });

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    const displayText = getOptionDisplay(option).toLowerCase();
    return displayText.includes(searchLower);
  });

  // Remove already selected options from filtered list
  const availableOptions = filteredOptions.filter(opt => {
    const optValue = String(getOptionValue(opt));
    return !selectedIds.includes(optValue);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    const optValue = String(getOptionValue(option));
    if (!selectedIds.includes(optValue)) {
      onChange([...selectedIds, optValue]);
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRemove = (optionValue) => {
    const optValue = String(optionValue);
    onChange(selectedIds.filter(id => id !== optValue));
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="multi-select-autocomplete-container" ref={dropdownRef}>
      {label && <label className="multi-select-autocomplete-label">{label}</label>}
      
      <div className="multi-select-autocomplete-wrapper">
        {/* Selected items as chips */}
        {selectedOptions.length > 0 && (
          <div className="multi-select-selected-chips">
            {selectedOptions.map(option => {
              const optValue = String(getOptionValue(option));
              return (
                <span key={optValue} className="multi-select-chip">
                  {getOptionDisplay(option)}
                  <button
                    type="button"
                    className="multi-select-chip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(optValue);
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search input */}
        <div className="multi-select-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="multi-select-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
          <span className="multi-select-icon">{isOpen ? '▲' : '▼'}</span>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div className="multi-select-dropdown-list">
            {availableOptions.length === 0 ? (
              <div className="multi-select-no-results">
                {searchQuery.trim() 
                  ? `No matches found for "${searchQuery}"`
                  : emptyMessage
                }
              </div>
            ) : (
              availableOptions.map(option => {
                const optValue = String(getOptionValue(option));
                return (
                  <div
                    key={optValue}
                    className="multi-select-option"
                    onClick={() => handleSelect(option)}
                  >
                    {getOptionDisplay(option)}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

