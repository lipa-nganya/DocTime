import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Text, Checkbox, IconButton, Snackbar } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../theme';
import CalendarPicker from '../components/CalendarPicker';

export default function NewCaseScreen({ navigation }) {
  const [dateOfProcedure, setDateOfProcedure] = useState(new Date());
  const [patientName, setPatientName] = useState('');
  const [inpatientNumber, setInpatientNumber] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [payerId, setPayerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState([]);
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

      // Handle different response formats
      const facilitiesData = facilitiesRes.data.facilities || facilitiesRes.data.data?.facilities || [];
      const payersData = payersRes.data.payers || payersRes.data.data?.payers || [];
      const proceduresData = proceduresRes.data.procedures || proceduresRes.data.data?.procedures || [];
      const members = teamMembersRes.data.teamMembers || teamMembersRes.data.teamMember || teamMembersRes.data.data?.teamMembers || [];
      
      console.log('Loaded data:', {
        facilities: facilitiesData.length,
        payers: payersData.length,
        procedures: proceduresData.length,
        teamMembers: members.length
      });
      
      setFacilities(facilitiesData);
      setPayers(payersData);
      setProcedures(proceduresData);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Error', `Failed to load data: ${error.response?.data?.error || error.message}`);
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
        procedureIds: selectedProcedures.length > 0 ? selectedProcedures : null,
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
      console.error('Error creating case:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request data:', {
        dateOfProcedure: dateOfProcedure.toISOString(),
        patientName,
        facilityId,
        payerId,
        procedureIds: selectedProcedures,
        teamMemberIds: selectedTeamMembers
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to create case';
      Alert.alert('Error', errorMessage);
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

  const toggleProcedure = (procedureId) => {
    if (selectedProcedures.includes(procedureId)) {
      setSelectedProcedures(selectedProcedures.filter(id => id !== procedureId));
    } else {
      setSelectedProcedures([...selectedProcedures, procedureId]);
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
    if (!procedureSearchQuery.trim()) {
      return true; // Show all if search is empty
    }
    const searchLower = procedureSearchQuery.toLowerCase().trim();
    const procedureName = (procedure.name || '').toLowerCase();
    return procedureName.includes(searchLower);
  });



  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <CalendarPicker
        label="Date of Procedure *"
        value={dateOfProcedure}
        onChange={setDateOfProcedure}
        style={styles.datePickerContainer}
      />

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
              outlineColor="#00c4cc"
              activeOutlineColor="#00c4cc"
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
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />
      <TextInput
        label="Patient Age"
        value={patientAge}
        onChangeText={setPatientAge}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      <Text style={styles.label}>Facility / Hospital</Text>
      {facilities.length === 0 ? (
        <Text style={styles.emptyStateText}>No facilities available. Add facilities in the admin app.</Text>
      ) : (
        <RNPickerSelect
          onValueChange={setFacilityId}
          items={facilities.map(f => ({ label: f.name, value: f.id }))}
          placeholder={{ label: 'Select facility', value: '' }}
          value={facilityId}
          style={pickerSelectStyles}
        />
      )}

      <Text style={styles.label}>Payer</Text>
      {payers.length === 0 ? (
        <Text style={styles.emptyStateText}>No payers available. Add payers in the admin app.</Text>
      ) : (
        <RNPickerSelect
          onValueChange={setPayerId}
          items={payers.map(p => ({ label: p.name, value: p.id }))}
          placeholder={{ label: 'Select payer', value: '' }}
          value={payerId}
          style={pickerSelectStyles}
        />
      )}

      <TextInput
        label="In-patient Number"
        value={inpatientNumber}
        onChangeText={setInpatientNumber}
        mode="outlined"
        style={styles.input}
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      <TextInput
        label="Invoice Number"
        value={invoiceNumber}
        onChangeText={setInvoiceNumber}
        mode="outlined"
        style={styles.input}
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      {/* Procedure - Collapsible Dropdown with Search (Same as Surgical Team Members) */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setProcedureExpanded(!procedureExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>
            Procedure {selectedProcedures.length > 0 && `(${selectedProcedures.length})`}
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
              outlineColor="#00c4cc"
              activeOutlineColor="#00c4cc"
            />
            <ScrollView style={styles.teamMembersList} nestedScrollEnabled>
              {procedures.length === 0 ? (
                <Text style={styles.noResultsText}>No procedures available. Add procedures in the admin app.</Text>
              ) : filteredProcedures.length === 0 ? (
                <Text style={styles.noResultsText}>
                  No procedures found matching "{procedureSearchQuery}"
                </Text>
              ) : (
                filteredProcedures.map((procedure) => (
                  <TouchableOpacity
                    key={procedure.id}
                    style={styles.checkboxRow}
                    onPress={() => toggleProcedure(procedure.id)}
                  >
                    <Checkbox
                      status={selectedProcedures.includes(procedure.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleProcedure(procedure.id)}
                    />
                    <Text style={styles.checkboxLabel}>
                      {procedure.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {selectedProcedures.length > 0 && (
              <View style={styles.selectedMembersContainer}>
                <Text style={styles.selectedMembersLabel}>Selected:</Text>
                <Text style={styles.selectedMembersText}>
                  {procedures
                    .filter(p => selectedProcedures.includes(p.id))
                    .map(p => p.name)
                    .join(', ')}
                </Text>
              </View>
            )}
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
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
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
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      <Button
        mode="contained"
        onPress={handleCreateCase}
        loading={loading}
        style={styles.button}
        textColor={theme.colors.buttonText}
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
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
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
    marginHorizontal: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  snackbar: {
    marginBottom: 50,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  dropdownContainer: {
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 0,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#f8f6eb', // Background to match logo
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
    backgroundColor: '#f8f6eb', // Background to match logo
  },
  teamMembersList: {
    maxHeight: 200,
    marginBottom: theme.spacing.sm,
  },
  noResultsText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.md,
    fontSize: 14,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
  },
  selectedMembersContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#f8f6eb', // Background to match logo
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
  datePickerContainer: {
    marginLeft: theme.spacing.md,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 0,
    borderRadius: 4,
    color: theme.colors.text,
    paddingRight: 30,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0,
    borderRadius: 4,
    color: theme.colors.text,
    paddingRight: 30,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
};

