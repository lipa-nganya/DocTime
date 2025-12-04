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
      />
    </div>
  );
}

