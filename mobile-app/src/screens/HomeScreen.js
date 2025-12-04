import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Button, Text, FAB, List } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import api from '../services/api';
import { theme } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    loadCases();
  }, []);

  // Refresh cases when screen comes into focus (e.g., after creating a new case)
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount (handled by useEffect)
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      // Refresh when screen comes into focus
      if (!loading && !refreshing) {
        loadCases();
      }
    }, [loading, refreshing])
  );

  const loadCases = async () => {
    try {
      const response = await api.get('/cases/upcoming');
      console.log('Cases response:', response.data);
      // Handle both response formats: { cases: [...] } or { success: true, cases: [...] }
      const casesData = response.data.cases || response.data.data?.cases || [];
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        networkError: error.networkError,
        apiBaseUrl: error.apiBaseUrl,
        code: error.code
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load cases';
      Alert.alert('Error', errorMessage);
      setCases([]); // Set empty array on error
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Upcoming Cases</Text>
        
        {loading ? (
          <Text>Loading...</Text>
        ) : cases.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No upcoming cases</Text>
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
                <Text style={styles.facility}>
                  {caseItem.facility?.name || 'No facility'}
                </Text>
                {caseItem.isReferred && (
                  <Text style={styles.referralTag}>Referred</Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('NewCase')}
        label="New Case"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
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
  },
  referralTag: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

