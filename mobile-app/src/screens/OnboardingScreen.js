import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, RadioButton, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

const ROLES = ['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'];
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
      await api.put('/auth/profile', {
        firstName: firstName.trim(),
        prefix,
        role,
        otherRole: role === 'Other' ? otherRole.trim() : null
      });

      await AsyncStorage.setItem('isOnboarded', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome to Doc Time</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>

      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        mode="outlined"
        style={styles.input}
        autoCapitalize="words"
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
      />

      <Text style={styles.sectionTitle}>What role best describes you?</Text>
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
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
  },
});
