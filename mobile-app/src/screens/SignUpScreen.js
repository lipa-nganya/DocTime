import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

export default function SignUpScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'pin'
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);
  const phoneInputRef = useRef(null);

  // Check if user is already authenticated when screen focuses or mounts
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      
      if (token && !onboarded) {
        // User is authenticated but not onboarded, navigate to onboarding
        navigation.replace('Onboarding');
      } else if (token && onboarded === 'true') {
        // User is authenticated and onboarded, navigate to home
        navigation.replace('MainTabs');
      }
    };

    // Check immediately on mount
    checkAuthAndRedirect();

    // Also check when screen focuses
    const unsubscribe = navigation.addListener('focus', checkAuthAndRedirect);

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }
  }, [step]);

  const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254') && cleaned.length === 9 && cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('📱 Requesting OTP for:', formattedPhone);
      console.log('📱 API Base URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/request-otp', { phoneNumber: formattedPhone });
      
      console.log('✅ OTP Response:', response.data);

      if (response.data && response.data.success) {
        setStep('otp');
        if (response.data.otp) {
          const digits = response.data.otp.split('').slice(0, 4);
          setOtp(digits);
        }
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ OTP send error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        request: error.request ? 'Request made but no response' : 'No request made'
      });
      
      let errorMsg = 'Failed to send OTP. ';
      if (error.response) {
        errorMsg += `Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMsg += `No response from server. API URL: ${api.defaults.baseURL}`;
      } else {
        errorMsg += error.message;
      }
      
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 4).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 4) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      if (index + pastedOtp.length < 4) {
        otpRefs.current[Math.min(index + pastedOtp.length, 3)]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP');
      return;
    }
    setStep('pin');
  };

  const handleSignUp = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      // Send original phone number format - backend will format it
      // Backend validator expects formats like 0712345678 or +254712345678
      const response = await api.post('/auth/signup', {
        phoneNumber: phoneNumber.trim(), // Send original format
        otp: otp.join(''),
        pin
        // Role will be set during onboarding
      });

      if (response.data && response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        // Don't set isOnboarded yet - user needs to complete onboarding
        await AsyncStorage.removeItem('isOnboarded');
        
        // Small delay to ensure AsyncStorage is written before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use replace to prevent going back to signup screen
        navigation.replace('Onboarding');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Request data sent:', {
        phoneNumber: phoneNumber.trim(),
        otp: otp.join(''),
        pin: '****',
        role: 'Surgeon'
      });
      const msg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to sign up';
      const field = error.response?.data?.field || '';
      Alert.alert('Sign Up Failed', field ? `${field}: ${msg}` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Doc Time</Text>
        <Text style={styles.subtitle}>Sign Up</Text>

        {step === 'phone' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                ref={phoneInputRef}
                style={styles.input}
                placeholder="0712345678"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
                autoFocus={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={styles.otpTitle}>Enter 4-digit OTP</Text>
            <Text style={styles.otpSubtitle}>
              We've sent a code to {formatPhoneNumber(phoneNumber)}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setOtp(['', '', '', '']);
                setStep('phone');
              }}
            >
              <Text style={styles.linkText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'pin' && (
          <>
            <Text style={styles.otpTitle}>Create PIN</Text>
            <Text style={styles.otpSubtitle}>
              Create a 4-6 digit PIN for secure login
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="0000"
                placeholderTextColor="#666"
                value={pin}
                onChangeText={(text) => {
                  const numericText = text.replace(/\D/g, '').slice(0, 6);
                  setPin(numericText);
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm PIN</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="0000"
                placeholderTextColor="#666"
                value={confirmPin}
                onChangeText={(text) => {
                  const numericText = text.replace(/\D/g, '').slice(0, 6);
                  setConfirmPin(numericText);
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (pin.length < 4 || pin !== confirmPin || loading) && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={pin.length < 4 || pin !== confirmPin || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface || '#f5f5f5',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary || '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  pinInput: {
    backgroundColor: theme.colors.surface || '#f5f5f5',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary || '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.surface || '#f5f5f5',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary || '#ccc',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
