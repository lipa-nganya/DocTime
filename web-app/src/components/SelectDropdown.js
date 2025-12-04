import React, { useState, useRef, useEffect } from 'react';
import './SelectDropdown.css';

// Global counter to track z-index for open dropdowns
let zIndexCounter = 1000;

export default function SelectDropdown({ value, onChange, options, placeholder, label, emptyMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Increase z-index when opened
      zIndexCounter += 1;
      setZIndex(zIndexCounter);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  if (options.length === 0) {
    return (
      <div className="select-dropdown-container">
        {label && <label className="select-dropdown-label">{label}</label>}
        <p className="empty-state-text">{emptyMessage || 'No options available'}</p>
      </div>
    );
  }

  return (
    <div className="select-dropdown-container" ref={dropdownRef}>
      {label && <label className="select-dropdown-label">{label}</label>}
      <div className="select-dropdown-wrapper">
        <div
          className={`select-dropdown-header ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`select-dropdown-value ${!selectedOption ? 'placeholder' : ''}`}>
            {displayValue}
          </span>
          <span className="select-dropdown-icon">{isOpen ? '▲' : '▼'}</span>
        </div>
        
        {isOpen && (
          <div 
            className="select-dropdown-list"
            ref={listRef}
            style={{ zIndex: zIndex }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`select-dropdown-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

