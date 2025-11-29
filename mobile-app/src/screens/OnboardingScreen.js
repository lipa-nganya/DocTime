import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

const ROLES = [
  { label: 'Surgeon', value: 'Surgeon' },
  { label: 'Assistant Surgeon', value: 'Assistant Surgeon' },
  { label: 'Anaesthetist', value: 'Anaesthetist' },
  { label: 'Assistant Anaesthetist', value: 'Assistant Anaesthetist' },
  { label: 'Other', value: 'Other' }
];
const PREFIXES = ['Mr', 'Miss', 'Dr', 'Mrs'];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [role, setRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!prefix) {
      Alert.alert('Error', 'Please select your prefix');
      return;
    }

    if (!role) {
      Alert.alert('Error', 'Please select your role');
      return;
    }

    if (role === 'Other' && !otherRole.trim()) {
      Alert.alert('Error', 'Please specify your role');
      return;
    }

    setLoading(true);
    try {
      // Check if token exists
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign up again. Session expired.');
        navigation.replace('SignUp');
        return;
      }
      
      console.log('📝 Updating profile:', {
        firstName: firstName.trim(),
        prefix,
        role,
        otherRole: role === 'Other' ? otherRole.trim() : null,
        hasToken: !!token
      });
      
      const response = await api.put('/auth/profile', {
        firstName: firstName.trim(),
        prefix,
        role,
        otherRole: role === 'Other' ? otherRole.trim() : null
      });

      console.log('✅ Profile updated:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);

      // Verify response is successful - check for success flag or status code
      if (response.status >= 200 && response.status < 300) {
        // Success - response is valid even without explicit success flag
        console.log('✅ Profile update successful');
      } else {
        throw new Error(`Profile update failed: HTTP ${response.status}`);
      }

      // Save onboarding status
      await AsyncStorage.setItem('isOnboarded', 'true');
      
      // Navigate to MainTabs (Home screen) using replace to prevent going back
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('❌ Onboarding error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Failed to save profile';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMsg = error.response.data.errors[0].msg || error.response.data.errors[0].message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome to Doc Time</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>

      <TextInput
        label="Preferred Name (First Name)"
        value={firstName}
        onChangeText={setFirstName}
        mode="outlined"
        style={styles.input}
        autoCapitalize="words"
        placeholder="Enter your first name"
      />

      <Text style={styles.sectionTitle}>Prefix</Text>
      <SegmentedButtons
        value={prefix}
        onValueChange={setPrefix}
        buttons={PREFIXES.map(p => ({
          value: p,
          label: p
        }))}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: theme.colors.primary,
            onSecondaryContainer: theme.colors.white,
          }
        }}
      />

      <Text style={styles.sectionTitle}>What role best describes you?</Text>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={(value) => setRole(value)}
          items={ROLES}
          value={role}
          placeholder={{
            label: 'Select your role',
            value: null,
          }}
          style={{
            inputIOS: styles.pickerInput,
            inputAndroid: styles.pickerInput,
            placeholder: {
              color: theme.colors.textSecondary,
            },
          }}
        />
      </View>

      {role === 'Other' && (
        <TextInput
          label="Specify your role"
          value={otherRole}
          onChangeText={setOtherRole}
          mode="outlined"
          style={styles.input}
        />
      )}

      <Button
        mode="contained"
        onPress={handleComplete}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Continue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
  },
  pickerInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
  },
});
