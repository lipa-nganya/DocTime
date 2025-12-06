import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import OTPInput from '../components/OTPInput';
import PinInput from '../components/PinInput';
import AlertModal from '../components/AlertModal';
import './SignUpScreen.css';

const logo = './logo.png';

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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
    setShowErrorModal(true);
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
      
      // Check if response indicates success
      if (response.data && (response.data.success || response.data.message)) {
        setOtpDigits(['', '', '', '']);
        setStep('otp');
        
        if (response.data.otp) {
          // Show OTP in development mode (non-blocking)
          console.log(`Development OTP: ${response.data.otp}`);
        }
      } else {
        // Response doesn't indicate success, but no error was thrown
        // Assume success and proceed (OTP might have been sent)
        setOtpDigits(['', '', '', '']);
        setStep('otp');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      
      // Check if user already exists
      if (error.response?.data?.userExists) {
        // User already exists - redirect to login
        showError('An account with this phone number already exists. Please login instead.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      // Check if we got a response (even if it's an error status)
      if (error.response && error.response.status < 500) {
        // Client error (4xx) - likely a real issue
        showError(error.response?.data?.error || error.message || 'Failed to send OTP');
      } else {
        // Server error or network error - SMS might have been sent
        // Allow user to proceed to OTP entry screen
        console.warn('⚠️  Error occurred, but allowing OTP entry (SMS might have been sent)');
        setOtpDigits(['', '', '', '']);
        setStep('otp');
      }
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
      <h1 className="screen-title">Sign Up</h1>
      <img src={logo} alt="Doc Time Logo" className="signup-logo" />

      {error && !showErrorModal && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-dismiss" onClick={() => setError('')}>×</button>
        </div>
      )}

      <AlertModal
        message={error}
        onClose={() => {
          setShowErrorModal(false);
          setError('');
        }}
        title="Sign Up Error"
      />

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
          <PinInput
            placeholder="Create PIN (4-6 digits)"
            value={pin}
            onChange={setPin}
            maxLength={6}
            autoFocus={true}
          />
          <PinInput
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={setConfirmPin}
            maxLength={6}
          />
          <div className="terms-checkbox-container">
            <label className="terms-checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="terms-checkbox"
              />
              <span className="terms-checkbox-text">
                By signing up, you agree to our{' '}
                <button
                  type="button"
                  className="terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/info/terms');
                  }}
                >
                  Terms of Use
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/info/privacy');
                  }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSignUp}
            disabled={loading || !agreedToTerms}
          >
            {loading ? 'Signing up...' : 'Continue'}
          </button>
        </>
      )}
    </div>
  );
}
