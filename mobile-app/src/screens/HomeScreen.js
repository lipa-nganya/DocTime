import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Button, Text, FAB, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await api.get('/cases/upcoming');
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error loading cases:', error);
      Alert.alert('Error', 'Failed to load cases');
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming cases</Text>
          </View>
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
    backgroundColor: theme.colors.background,
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
    elevation: 2,
  },
  emptyContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
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

