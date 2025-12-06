import React, { useState } from 'react';
import './PinInput.css';

export default function PinInput({ 
  value, 
  onChange, 
  placeholder, 
  maxLength = 6,
  autoFocus = false
}) {
  const [showPin, setShowPin] = useState(false);

  const toggleShowPin = () => {
    setShowPin(!showPin);
  };

  return (
    <div className="pin-input-wrapper">
      <input
        type={showPin ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        className="pin-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="pin-toggle-btn"
        onClick={toggleShowPin}
        aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
      >
        {showPin ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

