import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { Card, Text, SegmentedButtons, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { theme } from '../theme';

export default function CaseHistoryScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('completed');
  const [completedCases, setCompletedCases] = useState([]);
  const [cancelledCases, setCancelledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);

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
      setGeneratingInvoice(caseId);
      
      // Make authenticated request to get PDF
      // Use arraybuffer for better React Native compatibility
      const response = await api.get(`/invoices/${caseId}/pdf`, {
        responseType: 'arraybuffer', // Get binary data as array buffer
      });

      // Check if response is actually a PDF (starts with PDF magic bytes)
      // If we got JSON error instead, response.data might be a string
      let responseData = response.data;
      
      // Handle case where error response is JSON but we requested arraybuffer
      if (typeof responseData === 'string' || 
          (responseData instanceof ArrayBuffer && responseData.byteLength < 100)) {
        // Try to parse as JSON error
        try {
          const text = typeof responseData === 'string' 
            ? responseData 
            : new TextDecoder().decode(new Uint8Array(responseData));
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to generate invoice');
        } catch (parseError) {
          // If parsing fails, it might actually be a small PDF, continue
          if (parseError.message && parseError.message.includes('Failed to generate')) {
            throw parseError;
          }
        }
      }

      // Create a temporary file path
      const filename = `invoice-${caseId}-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Convert arraybuffer to base64
      // This works in both React Native and web
      const uint8Array = new Uint8Array(responseData);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      
      // Use btoa if available (web), otherwise use a polyfill
      let base64Data;
      if (typeof btoa !== 'undefined') {
        base64Data = btoa(binaryString);
      } else {
        // React Native base64 encoding (simple implementation)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < binaryString.length) {
          const a = binaryString.charCodeAt(i++);
          const b = i < binaryString.length ? binaryString.charCodeAt(i++) : 0;
          const c = i < binaryString.length ? binaryString.charCodeAt(i++) : 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < binaryString.length ? chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < binaryString.length ? chars.charAt(bitmap & 63) : '=';
        }
        base64Data = result;
      }

      // Write PDF file
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available and share/open the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice',
        });
      } else {
        Alert.alert('Success', 'Invoice downloaded successfully');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      let errorMessage = 'Failed to generate invoice';
      
      // Try to extract error message from various sources
      if (error.response) {
        // Check if response data is JSON
        if (error.response.data) {
          try {
            // If data is arraybuffer, try to decode it
            let errorText;
            if (error.response.data instanceof ArrayBuffer) {
              errorText = new TextDecoder().decode(new Uint8Array(error.response.data));
            } else if (typeof error.response.data === 'string') {
              errorText = error.response.data;
            } else {
              errorText = JSON.stringify(error.response.data);
            }
            
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If not JSON, use the text as is if it's short
              if (errorText.length < 200) {
                errorMessage = errorText;
              }
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
        
        // Fallback to status-based message
        if (errorMessage === 'Failed to generate invoice') {
          if (error.response.status === 404) {
            errorMessage = 'Case not found';
          } else if (error.response.status === 403) {
            errorMessage = 'Not authorized to generate invoice for this case';
          } else if (error.response.status === 400) {
            errorMessage = 'Cannot generate invoice for this case';
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setGeneratingInvoice(null);
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
                    textColor={theme.colors.outlinedButtonText}
                    borderColor={theme.colors.outlinedButtonBorder}
                    disabled={generatingInvoice === caseItem.id}
                    icon={generatingInvoice === caseItem.id ? () => <ActivityIndicator size="small" color={theme.colors.outlinedButtonText} /> : undefined}
                  >
                    {generatingInvoice === caseItem.id ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                )}
                {tab === 'cancelled' && (
                  <Button
                    mode="contained"
                    onPress={() => handleRestoreCase(caseItem.id)}
                    style={styles.restoreButton}
                    textColor={theme.colors.buttonText}
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
    backgroundColor: '#f8f6eb', // Background to match logo
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

