import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { Platform } from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (message) => {
    setError(message);
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      window.alert(message);
    }
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
      const result = await login(phoneNumber, pin);
      
      // Navigation will be handled by App.js based on auth state
      if (Platform.OS === 'web') {
        window.location.href = '/';
      }
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Failed to login');
    } finally {
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
      <TextInput
        label="PIN"
        value={pin}
        onChangeText={setPin}
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
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        textColor={theme.colors.buttonText}
      >
        Login
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.linkButton}
        textColor={theme.colors.outlinedButtonText}
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
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
