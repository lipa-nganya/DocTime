import React, { useRef, useEffect } from 'react';
import './OTPInput.css';

export default function OTPInput({ value, onChange, onComplete }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const text = e.target.value;
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      const digits = numericText.slice(0, 4).split('');
      const newValue = [...value];
      
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newValue[index + i] = digit;
        }
      });
      
      onChange(newValue);
      
      const nextIndex = Math.min(index + digits.length, 3);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      const newValue = [...value];
      newValue[index] = numericText;
      onChange(newValue);
      
      if (numericText && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  useEffect(() => {
    const otpValue = value.join('');
    if (otpValue.length === 4 && value.every(v => v !== '')) {
      const timer = setTimeout(() => {
        onComplete?.(otpValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, onComplete]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (e, index) => {
    e.target.select();
  };

  return (
    <div className="otp-input-container">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          className="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={(e) => handleFocus(e, index)}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}

