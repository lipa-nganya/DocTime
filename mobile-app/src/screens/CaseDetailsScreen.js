import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Text, Menu, Portal, Dialog, Paragraph } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../theme';

export default function CaseDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { caseId } = route.params;
  
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      setCaseItem(response.data.case);
    } catch (error) {
      Alert.alert('Error', 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('NewCase', { caseId, caseData: caseItem });
  };

  const handleComplete = async () => {
    try {
      await api.post(`/cases/${caseId}/complete`);
      Alert.alert('Success', 'Case marked as completed', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to complete case');
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/cases/${caseId}/cancel`);
      Alert.alert('Success', 'Case cancelled', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to cancel case');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cases/${caseId}`);
      Alert.alert('Success', 'Case deleted', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete case');
    } finally {
      setDeleteDialogVisible(false);
    }
  };

  const handleRefer = () => {
    navigation.navigate('ReferCase', { caseId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!caseItem) {
    return (
      <View style={styles.container}>
        <Text>Case not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.patientName}>{caseItem.patientName}</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button icon="dots-vertical" onPress={() => setMenuVisible(true)}>
                  Options
                </Button>
              }
            >
              <Menu.Item onPress={handleEdit} title="Edit" />
              <Menu.Item onPress={handleRefer} title="Refer Case" />
              {caseItem.status === 'Upcoming' && (
                <>
                  <Menu.Item onPress={handleComplete} title="Complete" />
                  <Menu.Item onPress={handleCancel} title="Cancel" />
                </>
              )}
              <Menu.Item onPress={() => setDeleteDialogVisible(true)} title="Delete" />
            </Menu>
          </View>

          <Text style={styles.label}>Date of Procedure</Text>
          <Text style={styles.value}>
            {new Date(caseItem.dateOfProcedure).toLocaleDateString()}
          </Text>

          {caseItem.inpatientNumber && (
            <>
              <Text style={styles.label}>In-patient Number</Text>
              <Text style={styles.value}>{caseItem.inpatientNumber}</Text>
            </>
          )}

          {caseItem.patientAge && (
            <>
              <Text style={styles.label}>Patient Age</Text>
              <Text style={styles.value}>{caseItem.patientAge}</Text>
            </>
          )}

          {caseItem.facility && (
            <>
              <Text style={styles.label}>Facility</Text>
              <Text style={styles.value}>{caseItem.facility.name}</Text>
            </>
          )}

          {caseItem.procedure && (
            <>
              <Text style={styles.label}>Procedure</Text>
              <Text style={styles.value}>{caseItem.procedure.name}</Text>
            </>
          )}

          {caseItem.amount && (
            <>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>KES {caseItem.amount}</Text>
            </>
          )}

          {caseItem.payer && (
            <>
              <Text style={styles.label}>Payer</Text>
              <Text style={styles.value}>{caseItem.payer.name}</Text>
            </>
          )}

          {caseItem.paymentStatus && (
            <>
              <Text style={styles.label}>Payment Status</Text>
              <Text style={styles.value}>{caseItem.paymentStatus}</Text>
            </>
          )}

          {caseItem.additionalNotes && (
            <>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{caseItem.additionalNotes}</Text>
            </>
          )}

          {caseItem.isReferred && (
            <View style={styles.referralBadge}>
              <Text style={styles.referralText}>Referred Case</Text>
            </View>
          )}

          {caseItem.isAutoCompleted && (
            <View style={styles.autoCompleteBadge}>
              <Text style={styles.autoCompleteText}>Auto-completed</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Case</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete this case? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
  },
  referralBadge: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  referralText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  autoCompleteBadge: {
    backgroundColor: theme.colors.textSecondary,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  autoCompleteText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});

