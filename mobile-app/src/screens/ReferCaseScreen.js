import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../theme';

export default function ReferCaseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { caseId } = route.params;

  const [refereePhoneNumber, setRefereePhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required');
        return;
      }

      const contact = await Contacts.pickContactAsync();
      if (contact && contact.phones && contact.phones.length > 0) {
        setRefereePhoneNumber(contact.phones[0].number);
      }
    } catch (error) {
      console.error('Error picking contact:', error);
    }
  };

  const handleRefer = async () => {
    if (!refereePhoneNumber) {
      Alert.alert('Error', 'Please enter referee phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/referrals', {
        caseId,
        refereePhoneNumber
      });

      Alert.alert('Success', 'Case referred successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to refer case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Refer Case to Another Doctor</Text>
      <Text style={styles.subtitle}>
        Enter the phone number of the doctor you want to refer this case to.
        They will receive an SMS with case details and a link to install the app.
      </Text>

      <TextInput
        label="Referee Phone Number"
        value={refereePhoneNumber}
        onChangeText={setRefereePhoneNumber}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
        placeholder="0712345678"
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      <Button
        mode="outlined"
        onPress={handlePickContact}
        icon="contacts"
        style={styles.button}
        textColor={theme.colors.outlinedButtonText}
        borderColor={theme.colors.outlinedButtonBorder}
      >
        Pick from Contacts
      </Button>

      <Button
        mode="contained"
        onPress={handleRefer}
        loading={loading}
        style={styles.submitButton}
        textColor={theme.colors.buttonText}
      >
        Send Referral
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
});

