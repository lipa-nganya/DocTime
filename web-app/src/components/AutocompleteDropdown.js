import React, { useState, useRef, useEffect } from 'react';
import './AutocompleteDropdown.css';

// Global counter to track z-index for open dropdowns
let zIndexCounter = 2000;

export default function AutocompleteDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  emptyMessage,
  onInputChange,
  onCreateNew,
  createLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zIndex, setZIndex] = useState(1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search query when closing
        if (!selectedOption) {
          setSearchQuery('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      zIndexCounter += 1;
      setZIndex(zIndexCounter);
      // Focus input when opened
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
  }, [isOpen, selectedOption]);

  // Update search query when display value changes externally
  useEffect(() => {
    if (selectedOption && !isOpen) {
      setSearchQuery(selectedOption.label);
    }
  }, [selectedOption, isOpen]);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsOpen(true);
    
    // Call optional onInputChange callback
    if (onInputChange) {
      onInputChange(query);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!selectedOption) {
      setSearchQuery('');
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    const selected = options.find(opt => opt.value === optionValue);
    setSearchQuery(selected ? selected.label : '');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery.trim()) {
      return true;
    }
    const searchLower = searchQuery.toLowerCase();
    const labelLower = option.label.toLowerCase();
    return labelLower.includes(searchLower);
  });

  if (options.length === 0) {
    return (
      <div className="autocomplete-dropdown-container">
        {label && <label className="autocomplete-dropdown-label">{label}</label>}
        <p className="empty-state-text">{emptyMessage || 'No options available'}</p>
      </div>
    );
  }

  return (
    <div className="autocomplete-dropdown-container" ref={dropdownRef}>
      {label && <label className="autocomplete-dropdown-label">{label}</label>}
      <div className="autocomplete-dropdown-wrapper">
        <div className={`autocomplete-dropdown-header ${isOpen ? 'open' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="autocomplete-input"
            value={isOpen ? searchQuery : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
          />
          <div className="autocomplete-actions">
            {value && (
              <button
                type="button"
                className="autocomplete-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                title="Clear selection"
              >
                ×
              </button>
            )}
            <span className="autocomplete-icon">{isOpen ? '▲' : '▼'}</span>
          </div>
        </div>
        
        {isOpen && (
          <div 
            className="autocomplete-dropdown-list"
            ref={listRef}
            style={{ zIndex: zIndex }}
          >
            {filteredOptions.length === 0 ? (
              <div className="autocomplete-no-results">
                {searchQuery.trim() && onCreateNew ? (
                  <div className="autocomplete-create-new">
                    <span>No matches found for "{searchQuery}"</span>
                    <button
                      type="button"
                      className="autocomplete-add-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCreateNew && searchQuery.trim()) {
                          onCreateNew(searchQuery.trim());
                          setSearchQuery('');
                          setIsOpen(false);
                        }
                      }}
                      title={`Add "${searchQuery.trim()}"`}
                    >
                      + Add "{searchQuery.trim()}"
                    </button>
                  </div>
                ) : (
                  <span>No matches found for "{searchQuery}"</span>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`autocomplete-option ${value === option.value ? 'selected' : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
                {searchQuery.trim() && onCreateNew && !filteredOptions.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase()) && (
                  <div
                    className="autocomplete-option autocomplete-create-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCreateNew && searchQuery.trim()) {
                        onCreateNew(searchQuery.trim());
                        setSearchQuery('');
                        setIsOpen(false);
                      }
                    }}
                  >
                    <span className="autocomplete-add-icon">+</span>
                    <span>Add "{searchQuery.trim()}"</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

