import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !pin) {
      Alert.alert('Error', 'Please enter phone number and PIN');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { phoneNumber, pin });
      
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      const isOnboarded = await AsyncStorage.getItem('isOnboarded');
      if (isOnboarded === 'true') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        navigation.navigate('Onboarding');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Error', 'Biometric authentication not available');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Get stored token and verify
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          try {
            const response = await api.post('/auth/verify-token', { token });
            const isOnboarded = await AsyncStorage.getItem('isOnboarded');
            if (isOnboarded === 'true') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } else {
              navigation.navigate('Onboarding');
            }
          } catch (error) {
            Alert.alert('Error', 'Session expired. Please login again.');
          }
        } else {
          Alert.alert('Error', 'Please login with PIN first');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>Login</Text>

      <TextInput
        label="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
        placeholder="0712345678"
      />
      <TextInput
        label="PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        secureTextEntry
        maxLength={6}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Login
      </Button>
      <Button
        mode="outlined"
        onPress={handleBiometricLogin}
        style={styles.button}
      >
        Use Biometrics
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.linkButton}
      >
        Don't have an account? Sign Up
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.appBackground,
  },
  logo: {
    width: 200,
    height: 120,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
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
  },
  linkButton: {
    marginTop: theme.spacing.md,
  },
});

