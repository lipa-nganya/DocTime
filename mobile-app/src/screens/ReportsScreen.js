import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import api from '../services/api';
import { theme } from '../theme';

export default function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!reports) {
    return (
      <View style={styles.container}>
        <Text>No reports available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Case Statistics</Text>
          <Text style={styles.statLabel}>Completed Cases</Text>
          <Text style={styles.statValue}>{reports.completedCases}</Text>
          
          <Text style={styles.statLabel}>Cancelled Cases</Text>
          <Text style={styles.statValue}>{reports.cancelledCases}</Text>
          
          <Text style={styles.statLabel}>Referred Cases</Text>
          <Text style={styles.statValue}>{reports.referredCases}</Text>
          
          <Text style={styles.statLabel}>Auto-completed Cases</Text>
          <Text style={styles.statValue}>{reports.autoCompletedCases}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <Text style={styles.statLabel}>Total Invoiced</Text>
          <Text style={styles.statValue}>KES {reports.invoicedAmount.toLocaleString()}</Text>
          
          <Text style={styles.statLabel}>Total Uninvoiced</Text>
          <Text style={styles.statValue}>KES {reports.uninvoicedAmount.toLocaleString()}</Text>
        </Card.Content>
      </Card>

      {reports.surgeonsAnalysis && reports.surgeonsAnalysis.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Surgeons Worked With</Text>
            {reports.surgeonsAnalysis.map((surgeon) => (
              <View key={surgeon.id} style={styles.surgeonRow}>
                <Text style={styles.surgeonName}>{surgeon.name}</Text>
                <Text style={styles.surgeonCount}>{surgeon.casesCount} cases</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {reports.facilitiesAnalysis && reports.facilitiesAnalysis.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Facilities</Text>
            {reports.facilitiesAnalysis.map((facility, index) => (
              <View key={index} style={styles.facilityRow}>
                <Text style={styles.facilityName}>{facility.facilityName}</Text>
                <Text style={styles.facilityStats}>
                  {facility.casesCount} cases • KES {facility.totalAmount.toLocaleString()}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  surgeonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  surgeonName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  surgeonCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  facilityRow: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  facilityStats: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

