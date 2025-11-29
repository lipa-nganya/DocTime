import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { TextInput, Button, Text, Snackbar, Alert } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'pin'
  const [loading, setLoading] = useState(false);
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const otpRefs = useRef([]);

  const handleRequestOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Prevent double-clicking
    if (requestingOTP || loading) {
      return;
    }

    setRequestingOTP(true);
    setLoading(true);
    try {
      console.log('📱 Requesting OTP for:', phoneNumber);
      const response = await api.post('/auth/request-otp', { phoneNumber });
      console.log('✅ OTP Response:', response.data);
      
      // Show snackbar notification
      setSnackbarMessage('OTP sent to your phone! Please check your messages.');
      setSnackbarVisible(true);
      
      // Automatically redirect to OTP screen
      setStep('otp');
      
      // In dev mode, auto-fill OTP if provided
      if (response.data.otp) {
        const otpDigits = response.data.otp.split('');
        setOtp(otpDigits);
        // Focus first input
        setTimeout(() => {
          if (otpRefs.current[0]) {
            otpRefs.current[0].focus();
          }
        }, 100);
      } else {
        // Focus first OTP input
        setTimeout(() => {
          if (otpRefs.current[0]) {
            otpRefs.current[0].focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ OTP Error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to send OTP. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
      setRequestingOTP(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
    
    // Auto-verify if all 4 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.length === 4) {
      const otpString = newOtp.join('');
      handleVerifyOTP(otpString);
    }
  };

  const handleOtpKeyPress = (index, key) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async (otpString = null) => {
    const otpCode = otpString || otp.join('');
    if (!otpCode || otpCode.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setStep('pin');
  };

  const handleSignUp = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        phoneNumber,
        otp: otp.join(''),
        pin,
        role: 'Surgeon', // Will be set in onboarding
        otherRole: null
      });

      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      setStep('onboarding');
      navigation.navigate('Onboarding');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doc Time</Text>
      <Text style={styles.subtitle}>Sign Up</Text>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

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
          />
          <Button
            mode="contained"
            onPress={handleRequestOTP}
            loading={loading}
            style={styles.button}
          >
            Send OTP
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Login
          </Button>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.otpLabel}>Enter 4-digit OTP</Text>
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3].map((index) => (
              <RNTextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    borderColor: otp[index] ? theme.colors.primary : theme.colors.textSecondary,
                  }
                ]}
                value={otp[index]}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                textColor={theme.colors.text}
                autoFocus={index === 0}
              />
            ))}
          </View>
          <Button
            mode="contained"
            onPress={() => handleVerifyOTP()}
            style={styles.button}
          >
            Verify OTP
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setOtp(['', '', '', '']);
              otpRefs.current.forEach((ref) => ref?.clear());
              setStep('phone');
            }}
            style={styles.linkButton}
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
            textColor={theme.colors.text}
            secureTextEntry
            maxLength={6}
          />
          <TextInput
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            textColor={theme.colors.text}
            secureTextEntry
            maxLength={6}
          />
          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            style={styles.button}
          >
            Sign Up
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
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  linkButton: {
    marginTop: theme.spacing.md,
  },
  otpLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  otpInput: {
    width: 60,
    height: 60,
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
});
