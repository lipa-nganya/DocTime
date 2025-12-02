import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'pin'
  const [loading, setLoading] = useState(false);
  const [requestingOTP, setRequestingOTP] = useState(false);

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
      console.log('📱 API Base URL:', api.defaults.baseURL);
      const response = await api.post('/auth/request-otp', { phoneNumber });
      console.log('✅ OTP Response:', response.data);
      
      // Automatically redirect to OTP screen
      setStep('otp');
      
      // In dev mode, show OTP if provided
      if (response.data.otp) {
        Alert.alert('OTP Sent', `Your OTP is: ${response.data.otp}\n\n(This is shown in development mode)`);
      } else {
        Alert.alert('Success', 'OTP sent to your phone');
      }
    } catch (error) {
      console.error('❌ OTP Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to send OTP. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
      setRequestingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
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
        otp,
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
          <TextInput
            label="Enter OTP (4 digits)"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            maxLength={4}
          />
          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            style={styles.button}
          >
            Verify OTP
          </Button>
          <Button
            mode="text"
            onPress={() => setStep('phone')}
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
});

