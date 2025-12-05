import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import OTPInput from '../components/OTPInput';
import './LoginScreen.css';

const logo = './logo.png';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPIN, setShowResetPIN] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resettingPIN, setResettingPIN] = useState(false);

  const showError = (message) => {
    setError(message);
    window.alert(message);
  };

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !pin.trim()) {
      showError('Please enter phone number and PIN');
      return;
    }

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await login(phoneNumber, pin);
      window.location.href = '/';
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOTP = async () => {
    if (!phoneNumber.trim()) {
      showError('Please enter your phone number');
      return;
    }

    setError('');
    setResettingPIN(true);

    try {
      await api.post('/auth/request-pin-reset-otp', { phoneNumber });
      setOtpSent(true);
      window.alert('OTP sent to your phone number');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setResettingPIN(false);
    }
  };

  const handleResetPIN = async () => {
    if (!otp || otp.length !== 4) {
      showError('Please enter the 4-digit OTP');
      return;
    }

    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      showError('PIN must be between 4 and 6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      showError('PINs do not match');
      return;
    }

    setError('');
    setResettingPIN(true);

    try {
      await api.post('/auth/reset-pin', {
        phoneNumber,
        otp,
        newPin
      });
      window.alert('PIN reset successfully. Please login with your new PIN.');
      setShowResetPIN(false);
      setOtpSent(false);
      setOtp('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to reset PIN');
    } finally {
      setResettingPIN(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="screen-title">Login</h1>
      <img src={logo} alt="Doc Time Logo" className="login-logo" />
      
      {error && (
        <div className="error-text">{error}</div>
      )}

      <input
        type="tel"
        className="form-input"
        placeholder="Phone Number (e.g., 0712345678)"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        autoFocus
      />
      <input
        type="password"
        className="form-input"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        maxLength={6}
      />
      
      {!showResetPIN ? (
        <>
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            className="btn btn-link"
            onClick={() => setShowResetPIN(true)}
          >
            Forgot PIN? Click here to reset
          </button>
          <button
            className="btn btn-link"
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Sign Up
          </button>
        </>
      ) : (
        <div className="reset-pin-container">
          <h3>Reset PIN</h3>
          
          {!otpSent ? (
            <>
              <p className="reset-instructions">
                Enter your phone number to receive an OTP for PIN reset.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleRequestResetOTP}
                disabled={resettingPIN}
              >
                {resettingPIN ? 'Sending...' : 'Send OTP'}
              </button>
              <button
                className="btn btn-link"
                onClick={() => {
                  setShowResetPIN(false);
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <p className="reset-instructions">
                Enter the OTP sent to your phone and create a new PIN.
              </p>
              <OTPInput
                value={otp}
                onChange={setOtp}
                length={4}
              />
              <input
                type="password"
                className="form-input"
                placeholder="New PIN (4-6 digits)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
              <input
                type="password"
                className="form-input"
                placeholder="Confirm New PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
              <button
                className="btn btn-primary"
                onClick={handleResetPIN}
                disabled={resettingPIN}
              >
                {resettingPIN ? 'Resetting...' : 'Reset PIN'}
              </button>
              <button
                className="btn btn-link"
                onClick={() => {
                  setShowResetPIN(false);
                  setOtpSent(false);
                  setOtp('');
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
