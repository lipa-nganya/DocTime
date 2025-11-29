import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, SegmentedButtons, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import api from '../services/api';
import { theme } from '../theme';

export default function CaseHistoryScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('completed');
  const [completedCases, setCompletedCases] = useState([]);
  const [cancelledCases, setCancelledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const [completedRes, cancelledRes] = await Promise.all([
        api.get('/cases/history/completed'),
        api.get('/cases/history/cancelled')
      ]);

      setCompletedCases(completedRes.data.cases || []);
      setCancelledCases(cancelledRes.data.cases || []);
    } catch (error) {
      console.error('Error loading cases:', error);
      Alert.alert('Error', 'Failed to load case history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  const handleCasePress = (caseItem) => {
    navigation.navigate('CaseDetails', { caseId: caseItem.id });
  };

  const handleGenerateInvoice = async (caseId) => {
    try {
      const invoiceUrl = `${api.defaults.baseURL.replace('/api', '')}/api/invoices/${caseId}/pdf`;
      const canOpen = await Linking.canOpenURL(invoiceUrl);
      if (canOpen) {
        await Linking.openURL(invoiceUrl);
      } else {
        Alert.alert('Error', 'Cannot open invoice URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const handleRestoreCase = async (caseId) => {
    try {
      await api.post(`/cases/${caseId}/restore`);
      Alert.alert('Success', 'Case restored', [
        { text: 'OK', onPress: () => loadCases() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to restore case');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cases = tab === 'completed' ? completedCases : cancelledCases;

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]}
        style={styles.segmentedButtons}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <Text>Loading...</Text>
        ) : cases.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No {tab} cases</Text>
            </Card.Content>
          </Card>
        ) : (
          cases.map((caseItem) => (
            <Card
              key={caseItem.id}
              style={styles.card}
              onPress={() => handleCasePress(caseItem)}
            >
              <Card.Content>
                <Text style={styles.patientName}>{caseItem.patientName}</Text>
                <Text style={styles.date}>{formatDate(caseItem.dateOfProcedure)}</Text>
                {caseItem.facility && (
                  <Text style={styles.facility}>{caseItem.facility.name}</Text>
                )}
                {caseItem.amount && (
                  <Text style={styles.amount}>KES {caseItem.amount}</Text>
                )}
                {caseItem.isAutoCompleted && (
                  <Text style={styles.autoCompleteTag}>Auto-completed</Text>
                )}
                {tab === 'completed' && (
                  <Button
                    mode="outlined"
                    onPress={() => handleGenerateInvoice(caseItem.id)}
                    style={styles.invoiceButton}
                  >
                    Generate Invoice
                  </Button>
                )}
                {tab === 'cancelled' && (
                  <Button
                    mode="contained"
                    onPress={() => handleRestoreCase(caseItem.id)}
                    style={styles.restoreButton}
                  >
                    Restore Case
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedButtons: {
    margin: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  emptyCard: {
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  facility: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  autoCompleteTag: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  invoiceButton: {
    marginTop: theme.spacing.md,
  },
  restoreButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

