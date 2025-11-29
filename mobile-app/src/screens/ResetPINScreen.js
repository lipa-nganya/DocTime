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
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../theme';

export default function ResetPINScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { phoneNumber, otp: initialOtp } = route.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('otp'); // 'otp', 'pin'
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (initialOtp && step === 'otp') {
      const digits = initialOtp.split('').slice(0, 4);
      setOtp(digits);
    }
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }
  }, [step, initialOtp]);

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

  const handleResetPIN = async () => {
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
      const response = await api.post('/auth/reset-pin', {
        phoneNumber,
        otp: otp.join(''),
        newPin: pin
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'PIN reset successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Reset PIN error:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to reset PIN';
      Alert.alert('Error', msg);
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
        <Text style={styles.title}>Reset PIN</Text>

        {step === 'otp' && (
          <>
            <Text style={styles.otpTitle}>Enter 4-digit OTP</Text>
            <Text style={styles.otpSubtitle}>
              We've sent a code to {phoneNumber}
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
          </>
        )}

        {step === 'pin' && (
          <>
            <Text style={styles.otpTitle}>Enter New PIN</Text>
            <Text style={styles.otpSubtitle}>
              Create a 4-6 digit PIN
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
              onPress={handleResetPIN}
              disabled={pin.length < 4 || pin !== confirmPin || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Reset PIN</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
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

