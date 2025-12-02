import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Checkbox, IconButton, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
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
  
  // Team members dropdown state
  const [teamMembersExpanded, setTeamMembersExpanded] = useState(false);
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState('');
  
  // Procedure dropdown state
  const [procedureExpanded, setProcedureExpanded] = useState(false);
  const [procedureSearchQuery, setProcedureSearchQuery] = useState('');
  
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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
      const members = teamMembersRes.data.teamMembers || teamMembersRes.data.teamMember || [];
      console.log('Loaded team members:', members.length, members);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  const handleCreateCase = async () => {
    if (!patientName || !dateOfProcedure) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cases', {
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

      setLoading(false);
      
      // Check if case was auto-completed due to past date
      if (response.data.isAutoCompleted) {
        setSnackbarMessage('Case has been added and marked as completed (date has passed)');
        setSnackbarVisible(true);
        // Navigate back after a short delay to show the toast
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        // Case is upcoming, show success and navigate back
        setSnackbarMessage('Case created successfully');
        setSnackbarVisible(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create case');
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

  // Filter team members based on search query
  const filteredTeamMembers = teamMembers.filter(member => {
    if (!teamMemberSearchQuery.trim()) {
      return true; // Show all if search is empty
    }
    const searchLower = teamMemberSearchQuery.toLowerCase().trim();
    const memberName = (member.name || '').toLowerCase();
    const memberRole = (member.role || '').toLowerCase();
    const otherRole = (member.otherRole || '').toLowerCase();
    
    return (
      memberName.includes(searchLower) ||
      memberRole.includes(searchLower) ||
      otherRole.includes(searchLower)
    );
  });

  // Filter procedures based on search query
  const filteredProcedures = procedures.filter(procedure => {
    const searchLower = procedureSearchQuery.toLowerCase();
    return procedure.name.toLowerCase().includes(searchLower);
  });

  // Get selected procedure name for display
  const getSelectedProcedureName = () => {
    const selected = procedures.find(p => p.id === procedureId);
    return selected ? selected.name : 'Select procedure';
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <TextInput
        label="Date of Procedure *"
        value={dateOfProcedure.toLocaleDateString()}
        mode="outlined"
        style={styles.input}
        onFocus={() => setShowDatePicker(true)}
        editable={false}
        right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
      />
      {showDatePicker && (
        <DateTimePicker
          value={dateOfProcedure}
          mode="date"
          display="default"
          minimumDate={undefined}
          maximumDate={undefined}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateOfProcedure(selectedDate);
            }
          }}
        />
      )}

      {/* Surgical Team Members - Collapsible Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setTeamMembersExpanded(!teamMembersExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>
            Surgical Team Members {selectedTeamMembers.length > 0 && `(${selectedTeamMembers.length})`}
          </Text>
          <IconButton
            icon={teamMembersExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            onPress={() => setTeamMembersExpanded(!teamMembersExpanded)}
          />
        </TouchableOpacity>
        
        {teamMembersExpanded && (
          <View style={styles.dropdownContent}>
            <TextInput
              label="Search team members"
              value={teamMemberSearchQuery}
              onChangeText={setTeamMemberSearchQuery}
              mode="outlined"
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
            />
            <ScrollView style={styles.teamMembersList} nestedScrollEnabled>
              {teamMembers.length === 0 ? (
                <Text style={styles.noResultsText}>No team members available. Add team members in the admin app.</Text>
              ) : filteredTeamMembers.length === 0 ? (
                <Text style={styles.noResultsText}>
                  No team members found matching "{teamMemberSearchQuery}"
                </Text>
              ) : (
                filteredTeamMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.checkboxRow}
                    onPress={() => toggleTeamMember(member.id)}
                  >
                    <Checkbox
                      status={selectedTeamMembers.includes(member.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleTeamMember(member.id)}
                    />
                    <Text style={styles.checkboxLabel}>
                      {member.name} {member.otherRole ? `(${member.role} - ${member.otherRole})` : `(${member.role})`}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {selectedTeamMembers.length > 0 && (
              <View style={styles.selectedMembersContainer}>
                <Text style={styles.selectedMembersLabel}>Selected:</Text>
                <Text style={styles.selectedMembersText}>
                  {teamMembers
                    .filter(m => selectedTeamMembers.includes(m.id))
                    .map(m => `${m.name} ${m.otherRole ? `(${m.role} - ${m.otherRole})` : `(${m.role})`}`)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TextInput
        label="Patient Name *"
        value={patientName}
        onChangeText={setPatientName}
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
        label="In-patient Number"
        value={inpatientNumber}
        onChangeText={setInpatientNumber}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Invoice Number"
        value={invoiceNumber}
        onChangeText={setInvoiceNumber}
        mode="outlined"
        style={styles.input}
      />

      {/* Procedure - Collapsible Dropdown with Search */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setProcedureExpanded(!procedureExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>
            Procedure {procedureId ? `- ${getSelectedProcedureName()}` : ''}
          </Text>
          <IconButton
            icon={procedureExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            onPress={() => setProcedureExpanded(!procedureExpanded)}
          />
        </TouchableOpacity>
        
        {procedureExpanded && (
          <View style={styles.dropdownContent}>
            <TextInput
              label="Search procedures"
              value={procedureSearchQuery}
              onChangeText={setProcedureSearchQuery}
              mode="outlined"
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
            />
            <ScrollView style={styles.procedureList} nestedScrollEnabled>
              {filteredProcedures.length === 0 ? (
                <Text style={styles.noResultsText}>No procedures found</Text>
              ) : (
                filteredProcedures.map((procedure) => (
                  <TouchableOpacity
                    key={procedure.id}
                    style={[
                      styles.procedureItem,
                      procedureId === procedure.id && styles.procedureItemSelected
                    ]}
                    onPress={() => {
                      setProcedureId(procedure.id);
                      setProcedureExpanded(false);
                      setProcedureSearchQuery('');
                    }}
                  >
                    <Text style={[
                      styles.procedureItemText,
                      procedureId === procedure.id && styles.procedureItemTextSelected
                    ]}>
                      {procedure.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

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
          { label: 'Pro Bono', value: 'Pro Bono' },
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
      <View style={styles.bottomSpacer} />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
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
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  snackbar: {
    marginBottom: 50,
  },
  dropdownContainer: {
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  dropdownContent: {
    backgroundColor: '#f9f9f9',
    padding: theme.spacing.md,
  },
  searchInput: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  teamMembersList: {
    maxHeight: 200,
    marginBottom: theme.spacing.sm,
  },
  procedureList: {
    maxHeight: 200,
    marginBottom: theme.spacing.sm,
  },
  procedureItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: theme.colors.background,
  },
  procedureItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  procedureItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  procedureItemTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  noResultsText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.md,
  },
  selectedMembersContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  selectedMembersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  selectedMembersText: {
    fontSize: 14,
    color: theme.colors.text,
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

