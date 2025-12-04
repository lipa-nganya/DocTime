import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { theme } from '../theme';
import OTPInput from '../components/OTPInput';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { signup } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'pin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (phone) => {
    // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
    let formatted = phone.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    // Remove 254 prefix if present, then add it back
    if (formatted.startsWith('254')) {
      formatted = formatted.substring(3);
    }
    
    // Ensure we have exactly 9 digits, then add 254 prefix
    if (formatted.length > 9) {
      formatted = formatted.substring(0, 9);
    }
    
    return '254' + formatted;
  };

  const showError = (message) => {
    setError(message);
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      // For native, you could use Alert.alert here
      window.alert(message);
    }
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
      
      if (response.data.otp && Platform.OS === 'web') {
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
    console.log('🔘 Sign Up button clicked');
    console.log('📝 Form state:', {
      phoneNumber,
      otp: otpDigits.join(''),
      pinLength: pin.length,
      confirmPinLength: confirmPin.length,
      step
    });

    if (!pin || pin.length < 4) {
      console.log('❌ PIN validation failed: too short');
      showError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      console.log('❌ PIN validation failed: pins do not match');
      showError('PINs do not match');
      return;
    }

    if (loading) {
      console.log('⏸️ Already loading, ignoring click');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('🔄 Starting signup process...');
      const otp = otpDigits.join('');
      console.log('📤 Calling signup with:', { phoneNumber, otpLength: otp.length, pinLength: pin.length });
      
      await signup(phoneNumber, otp, pin);
      
      console.log('✅ Signup successful, redirecting...');
      console.log('🧭 Navigation state:', { isAuthenticated: true, isOnboarded: false });
      
      // On web, force a full page reload to ensure App.js picks up the new auth state
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform: forcing page reload...');
        // Use window.location.reload() instead of href for immediate reload
        window.location.reload();
      } else {
        // On native, navigation will be handled by App.js based on auth state
        // The state update in AuthContext should trigger a re-render
        console.log('📱 Native platform: navigation handled by App.js');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sign up';
      showError(errorMessage);
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {step === 'phone' && (
        <>
          <TextInput
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            placeholder="0712345678"
            outlineColor="#00c4cc"
            activeOutlineColor="#00c4cc"
            autoFocus
          />
          <Button
            mode="contained"
            onPress={handleRequestOTP}
            loading={loading}
            disabled={loading}
            style={styles.button}
            textColor={theme.colors.buttonText}
          >
            Send OTP
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
            textColor={theme.colors.outlinedButtonText}
          >
            Already have an account? Login
          </Button>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.instruction}>
            Enter the 4-digit code sent to {phoneNumber}
          </Text>
          <OTPInput
            value={otpDigits}
            onChange={setOtpDigits}
            onComplete={handleOTPComplete}
          />
          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            loading={loading}
            disabled={loading}
            style={styles.button}
            textColor={theme.colors.buttonText}
          >
            Verify OTP
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setStep('phone');
              setOtpDigits(['', '', '', '']);
            }}
            style={styles.linkButton}
            textColor={theme.colors.outlinedButtonText}
          >
            Resend OTP
          </Button>
        </>
      )}

      {step === 'pin' && (
        <>
          <TextInput
            label="Create PIN (4-6 digits)"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            secureTextEntry
            maxLength={6}
            outlineColor="#00c4cc"
            activeOutlineColor="#00c4cc"
            autoFocus
          />
          <TextInput
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            secureTextEntry
            maxLength={6}
            outlineColor="#00c4cc"
            activeOutlineColor="#00c4cc"
          />
          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            textColor={theme.colors.buttonText}
          >
            Continue
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#f8f6eb',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  linkButton: {
    marginTop: theme.spacing.md,
  },
  instruction: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
