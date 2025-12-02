import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, RadioButton } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

const ROLES = ['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'];
const PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.'];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [prefix, setPrefix] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [role, setRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!preferredName) {
      Alert.alert('Error', 'Please enter your preferred name');
      return;
    }

    if (!role) {
      Alert.alert('Error', 'Please select your role');
      return;
    }

    if (role === 'Other' && !otherRole) {
      Alert.alert('Error', 'Please specify your role');
      return;
    }

    setLoading(true);
    try {
      // Update user profile
      const response = await api.put('/auth/profile', {
        prefix: prefix || null,
        preferredName,
        role,
        otherRole: role === 'Other' ? otherRole : null
      });

      // Update stored user data
      const userData = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      await AsyncStorage.setItem('user', JSON.stringify({
        ...userData,
        ...response.data.user
      }));

      await AsyncStorage.setItem('isOnboarded', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome to Doc Time</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>

      <Text style={styles.sectionLabel}>Prefix (Optional)</Text>
      <RNPickerSelect
        onValueChange={setPrefix}
        items={PREFIXES.map(p => ({ label: p, value: p }))}
        placeholder={{ label: 'Select prefix', value: '' }}
        value={prefix}
        style={pickerSelectStyles}
      />

      <TextInput
        label="Preferred Name *"
        value={preferredName}
        onChangeText={setPreferredName}
        mode="outlined"
        style={styles.input}
        placeholder="Enter your preferred name"
      />

      <Text style={styles.sectionLabel}>What role best describes you?</Text>

      <RadioButton.Group onValueChange={setRole} value={role}>
        {ROLES.map((r) => (
          <View key={r} style={styles.radioRow}>
            <RadioButton value={r} />
            <Text style={styles.radioLabel}>{r}</Text>
          </View>
        ))}
      </RadioButton.Group>

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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },
  input: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
  },
  sectionLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    color: theme.colors.text,
    paddingRight: 30,
    marginBottom: theme.spacing.md,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    color: theme.colors.text,
    paddingRight: 30,
    marginBottom: theme.spacing.md,
  },
};

