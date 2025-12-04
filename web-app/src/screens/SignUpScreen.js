import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import OTPInput from '../components/OTPInput';
import './SignUpScreen.css';

const logo = '/logo.png';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (phone) => {
    let formatted = phone.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    if (formatted.startsWith('254')) {
      formatted = formatted.substring(3);
    }
    
    if (formatted.length > 9) {
      formatted = formatted.substring(0, 9);
    }
    
    return '254' + formatted;
  };

  const showError = (message) => {
    setError(message);
    window.alert(message);
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      showError('Please enter your phone number');
      return;
    }

    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/request-otp', { phoneNumber });
      
      setOtpDigits(['', '', '', '']);
      setStep('otp');
      
      if (response.data.otp) {
        window.alert(`Your OTP is: ${response.data.otp}\n\n(This is shown in development mode)`);
      }
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 4) {
      showError('Please enter a valid 4-digit OTP');
      return;
    }

    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await api.post('/auth/verify-otp', {
        phoneNumber: formattedPhone,
        otp
      });

      if (response.data.success) {
        setStep('pin');
      }
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = (otpValue) => {
    if (otpValue && otpValue.length === 4) {
      handleVerifyOTP();
    }
  };

  const handleSignUp = async () => {
    if (!pin || pin.length < 4) {
      showError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      showError('PINs do not match');
      return;
    }

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const otp = otpDigits.join('');
      await signup(phoneNumber, otp, pin);
      window.location.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sign up';
      showError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <img src={logo} alt="Doc Time Logo" className="signup-logo" />

      {error && (
        <div className="error-text">{error}</div>
      )}

      {step === 'phone' && (
        <>
          <input
            type="tel"
            className="form-input"
            placeholder="Phone Number (e.g., 0712345678)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleRequestOTP}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
          <button
            className="btn btn-link"
            onClick={() => navigate('/login')}
          >
            Already have an account? Login
          </button>
        </>
      )}

      {step === 'otp' && (
        <>
          <p className="instruction">
            Enter the 4-digit code sent to {phoneNumber}
          </p>
          <OTPInput
            value={otpDigits}
            onChange={setOtpDigits}
            onComplete={handleOTPComplete}
          />
          <button
            className="btn btn-primary"
            onClick={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            className="btn btn-link"
            onClick={() => {
              setStep('phone');
              setOtpDigits(['', '', '', '']);
            }}
          >
            Resend OTP
          </button>
        </>
      )}

      {step === 'pin' && (
        <>
          <input
            type="password"
            className="form-input"
            placeholder="Create PIN (4-6 digits)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            autoFocus
          />
          <input
            type="password"
            className="form-input"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            maxLength={6}
          />
          <button
            className="btn btn-primary"
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Continue'}
          </button>
        </>
      )}
    </div>
  );
}
