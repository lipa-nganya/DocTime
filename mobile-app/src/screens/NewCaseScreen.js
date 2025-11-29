import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Checkbox, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import api from '../services/api';
import { theme } from '../theme';

export default function NewCaseScreen({ navigation }) {
  const [dateOfProcedure, setDateOfProcedure] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [inpatientNumber, setInpatientNumber] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [payerId, setPayerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);

  const [facilities, setFacilities] = useState([]);
  const [payers, setPayers] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [facilitiesRes, payersRes, proceduresRes, teamMembersRes] = await Promise.all([
        api.get('/facilities'),
        api.get('/payers'),
        api.get('/procedures'),
        api.get('/team-members')
      ]);

      setFacilities(facilitiesRes.data.facilities || []);
      setPayers(payersRes.data.payers || []);
      setProcedures(proceduresRes.data.procedures || []);
      setTeamMembers(teamMembersRes.data.teamMembers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateCase = async () => {
    if (!patientName || !dateOfProcedure) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cases', {
        dateOfProcedure: dateOfProcedure.toISOString(),
        patientName,
        inpatientNumber: inpatientNumber || null,
        patientAge: patientAge ? parseInt(patientAge) : null,
        facilityId: facilityId || null,
        payerId: payerId || null,
        invoiceNumber: invoiceNumber || null,
        procedureId: procedureId || null,
        amount: amount ? parseFloat(amount) : null,
        paymentStatus,
        additionalNotes: additionalNotes || null,
        teamMemberIds: selectedTeamMembers
      });

      Alert.alert('Success', 'Case created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamMember = (memberId) => {
    if (selectedTeamMembers.includes(memberId)) {
      setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== memberId));
    } else {
      setSelectedTeamMembers([...selectedTeamMembers, memberId]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Date of Procedure *"
        value={dateOfProcedure.toLocaleDateString()}
        mode="outlined"
        style={styles.input}
        onFocus={() => setShowDatePicker(true)}
        editable={false}
      />
      {showDatePicker && (
        <DateTimePicker
          value={dateOfProcedure}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateOfProcedure(selectedDate);
            }
          }}
        />
      )}

      <Text style={styles.sectionTitle}>Surgical Team Members</Text>
      {teamMembers.map((member) => (
        <View key={member.id} style={styles.checkboxRow}>
          <Checkbox
            status={selectedTeamMembers.includes(member.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleTeamMember(member.id)}
          />
          <Text style={styles.checkboxLabel}>
            {member.name} ({member.role})
          </Text>
        </View>
      ))}

      <TextInput
        label="Patient Name *"
        value={patientName}
        onChangeText={setPatientName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="In-patient Number"
        value={inpatientNumber}
        onChangeText={setInpatientNumber}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Patient Age"
        value={patientAge}
        onChangeText={setPatientAge}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.label}>Facility / Hospital</Text>
      <RNPickerSelect
        onValueChange={setFacilityId}
        items={facilities.map(f => ({ label: f.name, value: f.id }))}
        placeholder={{ label: 'Select facility', value: '' }}
        value={facilityId}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>Payer</Text>
      <RNPickerSelect
        onValueChange={setPayerId}
        items={payers.map(p => ({ label: p.name, value: p.id }))}
        placeholder={{ label: 'Select payer', value: '' }}
        value={payerId}
        style={pickerSelectStyles}
      />

      <TextInput
        label="Invoice Number"
        value={invoiceNumber}
        onChangeText={setInvoiceNumber}
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.label}>Procedure</Text>
      <RNPickerSelect
        onValueChange={setProcedureId}
        items={procedures.map(p => ({ label: p.name, value: p.id }))}
        placeholder={{ label: 'Select procedure', value: '' }}
        value={procedureId}
        style={pickerSelectStyles}
      />

      <TextInput
        label="Amount (KES)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.label}>Payment Status</Text>
      <RNPickerSelect
        onValueChange={setPaymentStatus}
        items={[
          { label: 'Pending', value: 'Pending' },
          { label: 'Paid', value: 'Paid' },
          { label: 'Partially Paid', value: 'Partially Paid' },
          { label: 'Cancelled', value: 'Cancelled' }
        ]}
        value={paymentStatus}
        style={pickerSelectStyles}
      />

      <TextInput
        label="Additional Notes/Comments"
        value={additionalNotes}
        onChangeText={setAdditionalNotes}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleCreateCase}
        loading={loading}
        style={styles.button}
      >
        Create Case
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
    marginLeft: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
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

