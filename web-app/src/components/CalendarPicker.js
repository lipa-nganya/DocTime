import React from 'react';
import './CalendarPicker.css';

export default function CalendarPicker({ value, onChange, label, style }) {
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="calendar-picker-container" style={style}>
      {label && (
        <label className="calendar-picker-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '100%' }}>
        <input
          type="date"
          value={value ? formatDateForInput(value) : ''}
          onChange={(e) => {
            if (e.target.value) {
              const selectedDate = new Date(e.target.value + 'T00:00:00');
              onChange(selectedDate);
            } else {
              onChange(null);
            }
          }}
          className="calendar-picker-input"
          // Ensure calendar icon is visible on mobile devices
          style={{ 
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            cursor: 'pointer'
          }}
          aria-label={label || "Select date"}
        />
        {/* Custom calendar icon overlay for better visibility */}
        <span 
          className="calendar-icon-overlay"
          onClick={(e) => {
            e.stopPropagation();
            const input = e.target.parentElement.querySelector('.calendar-picker-input');
            if (input) {
              input.focus();
              // Try to show native date picker if available
              if (input.showPicker) {
                input.showPicker();
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const input = e.target.parentElement.querySelector('.calendar-picker-input');
              if (input) {
                input.focus();
                if (input.showPicker) {
                  input.showPicker();
                }
              }
            }
          }}
          role="button"
          aria-label="Open calendar"
          tabIndex={0}
        />
      </div>
    </div>
  );
}

