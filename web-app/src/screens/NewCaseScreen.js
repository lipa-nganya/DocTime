import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import CalendarPicker from '../components/CalendarPicker';
import SelectDropdown from '../components/SelectDropdown';
import AutocompleteDropdown from '../components/AutocompleteDropdown';
import './NewCaseScreen.css';

export default function NewCaseScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCaseId = searchParams.get('edit');
  const isEditMode = !!editCaseId;
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
  const [status, setStatus] = useState('Upcoming');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);

  const [facilities, setFacilities] = useState([]);
  const [payers, setPayers] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [teamMembersExpanded, setTeamMembersExpanded] = useState(false);
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState('');
  const [procedureExpanded, setProcedureExpanded] = useState(false);
  const [procedureSearchQuery, setProcedureSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadData();
    if (isEditMode && editCaseId) {
      loadCaseData(editCaseId);
    }
  }, [isEditMode, editCaseId]);

  const loadData = async () => {
    try {
      const [facilitiesRes, payersRes, proceduresRes, teamMembersRes] = await Promise.all([
        api.get('/facilities'),
        api.get('/payers'),
        api.get('/procedures'),
        api.get('/team-members')
      ]);

      const facilitiesData = facilitiesRes.data.facilities || facilitiesRes.data.data?.facilities || [];
      const payersData = payersRes.data.payers || payersRes.data.data?.payers || [];
      const proceduresData = proceduresRes.data.procedures || proceduresRes.data.data?.procedures || [];
      const members = teamMembersRes.data.teamMembers || teamMembersRes.data.teamMember || teamMembersRes.data.data?.teamMembers || [];
      
      setFacilities(facilitiesData);
      setPayers(payersData);
      setProcedures(proceduresData);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading data:', error);
      window.alert(`Failed to load data: ${error.response?.data?.error || error.message}`);
    }
  };

  const loadCaseData = async (caseId) => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      const caseData = response.data.case;
      
      // Pre-populate all fields
      if (caseData.dateOfProcedure) {
        setDateOfProcedure(new Date(caseData.dateOfProcedure));
      }
      setPatientName(caseData.patientName || '');
      setInpatientNumber(caseData.inpatientNumber || '');
      setPatientAge(caseData.patientAge ? String(caseData.patientAge) : '');
      setFacilityId(caseData.facilityId ? String(caseData.facilityId) : '');
      setPayerId(caseData.payerId ? String(caseData.payerId) : '');
      setInvoiceNumber(caseData.invoiceNumber || '');
      setAmount(caseData.amount ? String(caseData.amount) : '');
      setPaymentStatus(caseData.paymentStatus || 'Pending');
      setStatus(caseData.status || 'Upcoming');
      setAdditionalNotes(caseData.additionalNotes || '');
      
      // Set selected procedures (handle both singular and plural)
      const procedures = caseData.procedures || (caseData.procedure ? [caseData.procedure] : []);
      if (procedures.length > 0) {
        setSelectedProcedures(procedures.map(p => String(p.id)));
      }
      
      // Set selected team members
      if (caseData.teamMembers && caseData.teamMembers.length > 0) {
        setSelectedTeamMembers(caseData.teamMembers.map(m => String(m.id)));
      }
    } catch (error) {
      console.error('Error loading case data:', error);
      window.alert(`Failed to load case data: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!patientName || !dateOfProcedure) {
      window.alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
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
        status: isEditMode ? status : undefined, // Only send status when editing
        additionalNotes: additionalNotes || null,
        teamMemberIds: selectedTeamMembers
      };

      let response;
      if (isEditMode) {
        // Update existing case
        response = await api.put(`/cases/${editCaseId}`, payload);
        setSnackbarMessage('Case updated successfully');
        setSnackbarVisible(true);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        // Create new case
        response = await api.post('/cases', payload);
        
        // Success - show appropriate message based on auto-completion
        if (response.data?.isAutoCompleted) {
          setSnackbarMessage('Case has been added and marked as completed (date has passed)');
          setSnackbarVisible(true);
          setTimeout(() => {
            navigate('/', { state: { refresh: true } });
          }, 2000);
        } else {
          setSnackbarMessage('Case created successfully');
          setSnackbarVisible(true);
          setTimeout(() => {
            navigate('/', { state: { refresh: true } });
          }, 1500);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} case:`, error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          `Failed to ${isEditMode ? 'update' : 'create'} case`;
      window.alert(errorMessage);
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
    // Ensure procedureId is a string for consistent comparison
    const procedureIdStr = String(procedureId);
    if (selectedProcedures.includes(procedureIdStr)) {
      setSelectedProcedures(selectedProcedures.filter(id => id !== procedureIdStr));
    } else {
      setSelectedProcedures([...selectedProcedures, procedureIdStr]);
    }
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    if (!teamMemberSearchQuery.trim()) return true;
    const searchLower = teamMemberSearchQuery.toLowerCase().trim();
    const memberName = (member.name || '').toLowerCase();
    const memberRole = (member.role || '').toLowerCase();
    const otherRole = (member.otherRole || '').toLowerCase();
    return memberName.includes(searchLower) || memberRole.includes(searchLower) || otherRole.includes(searchLower);
  });

  const filteredProcedures = procedures.filter(procedure => {
    if (!procedureSearchQuery.trim()) return true;
    const searchLower = procedureSearchQuery.toLowerCase().trim();
    const procedureName = (procedure.name || '').toLowerCase();
    return procedureName.includes(searchLower);
  });

  return (
    <div className="new-case-container">
      <div className="new-case-content">
        <CalendarPicker
          label="Date of Procedure *"
          value={dateOfProcedure}
          onChange={setDateOfProcedure}
        />

        <div className="dropdown-container">
          <div
            className="dropdown-header"
            onClick={() => setTeamMembersExpanded(!teamMembersExpanded)}
          >
            <span className="dropdown-header-text">
              Surgical Team Members {selectedTeamMembers.length > 0 && `(${selectedTeamMembers.length})`}
            </span>
            <span className="dropdown-icon">{teamMembersExpanded ? '▲' : '▼'}</span>
          </div>
          
          {teamMembersExpanded && (
            <div className="dropdown-content">
              <input
                type="text"
                className="search-input"
                placeholder="Search team members"
                value={teamMemberSearchQuery}
                onChange={(e) => setTeamMemberSearchQuery(e.target.value)}
              />
              <div className="scrollable-list">
                {teamMembers.length === 0 ? (
                  <p className="no-results-text">No team members available. Add team members in the admin app.</p>
                ) : filteredTeamMembers.length === 0 ? (
                  <p className="no-results-text">
                    No team members found matching "{teamMemberSearchQuery}"
                  </p>
                ) : (
                  filteredTeamMembers.map((member) => (
                    <label key={member.id} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={selectedTeamMembers.includes(member.id)}
                        onChange={() => toggleTeamMember(member.id)}
                      />
                      <span className="checkbox-label">
                        {member.name} {member.otherRole ? `(${member.role} - ${member.otherRole})` : `(${member.role})`}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedTeamMembers.length > 0 && (
                <div className="selected-container">
                  <span className="selected-label">Selected:</span>
                  <span className="selected-text">
                    {teamMembers
                      .filter(m => selectedTeamMembers.includes(m.id))
                      .map(m => `${m.name} ${m.otherRole ? `(${m.role} - ${m.otherRole})` : `(${m.role})`}`)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Patient Name *"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
        <input
          type="number"
          className="form-input"
          placeholder="Patient Age"
          value={patientAge}
          onChange={(e) => setPatientAge(e.target.value)}
        />

        <AutocompleteDropdown
          label="Facility / Hospital"
          value={facilityId}
          onChange={setFacilityId}
          options={facilities.map(f => ({ label: f.name, value: f.id }))}
          placeholder="Type to search facility..."
          emptyMessage="No facilities available. Add facilities in the admin app."
        />

        <AutocompleteDropdown
          label="Payer"
          value={payerId}
          onChange={setPayerId}
          options={payers.map(p => ({ label: p.name, value: p.id }))}
          placeholder="Type to search payer..."
          emptyMessage="No payers available. Add payers in the admin app."
        />

        <input
          type="text"
          className="form-input"
          placeholder="In-patient Number"
          value={inpatientNumber}
          onChange={(e) => setInpatientNumber(e.target.value)}
        />

        <input
          type="text"
          className="form-input"
          placeholder="Invoice Number"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />

        <div className="dropdown-container">
          <div
            className="dropdown-header"
            onClick={() => setProcedureExpanded(!procedureExpanded)}
          >
            <span className="dropdown-header-text">
              Procedure {selectedProcedures.length > 0 && `(${selectedProcedures.length})`}
            </span>
            <span className="dropdown-icon">{procedureExpanded ? '▲' : '▼'}</span>
          </div>
          
          {procedureExpanded && (
            <div className="dropdown-content">
              <input
                type="text"
                className="search-input"
                placeholder="Search procedures"
                value={procedureSearchQuery}
                onChange={(e) => setProcedureSearchQuery(e.target.value)}
              />
              <div className="scrollable-list">
                {procedures.length === 0 ? (
                  <p className="no-results-text">No procedures available. Add procedures in the admin app.</p>
                ) : filteredProcedures.length === 0 ? (
                  <p className="no-results-text">
                    No procedures found matching "{procedureSearchQuery}"
                  </p>
                ) : (
                  <>
                    {/* Show selected procedures first, then unselected ones */}
                    {filteredProcedures
                      .filter(procedure => selectedProcedures.includes(String(procedure.id)))
                      .map((procedure) => (
                        <label key={`selected-${procedure.id}`} className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={selectedProcedures.includes(String(procedure.id))}
                            onChange={() => toggleProcedure(procedure.id)}
                          />
                          <span className="checkbox-label">{procedure.name}</span>
                        </label>
                      ))}
                    {/* Show unselected procedures */}
                    {filteredProcedures
                      .filter(procedure => !selectedProcedures.includes(String(procedure.id)))
                      .map((procedure) => (
                        <label key={procedure.id} className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={selectedProcedures.includes(String(procedure.id))}
                            onChange={() => toggleProcedure(procedure.id)}
                          />
                          <span className="checkbox-label">{procedure.name}</span>
                        </label>
                      ))}
                  </>
                )}
              </div>
              {selectedProcedures.length > 0 && (
                <div className="selected-container">
                  <span className="selected-label">Selected:</span>
                  <span className="selected-text">
                    {procedures
                      .filter(p => selectedProcedures.includes(String(p.id)))
                      .map(p => p.name)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          type="number"
          className="form-input"
          placeholder="Amount (KES)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
        />

        <SelectDropdown
          label="Payment Status"
          value={paymentStatus}
          onChange={setPaymentStatus}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Pro Bono', value: 'Pro Bono' },
            { label: 'Cancelled', value: 'Cancelled' }
          ]}
          placeholder="Select payment status"
        />

        {isEditMode && (status === 'Completed' || status === 'Invoiced' || status === 'Paid') && (
          <SelectDropdown
            label="Case Status"
            value={status}
            onChange={setStatus}
            options={
              status === 'Completed' 
                ? [
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Invoiced', value: 'Invoiced' }
                  ]
                : status === 'Invoiced'
                ? [
                    { label: 'Invoiced', value: 'Invoiced' },
                    { label: 'Paid', value: 'Paid' }
                  ]
                : [
                    { label: 'Paid', value: 'Paid' }
                  ]
            }
            placeholder="Select case status"
          />
        )}

        <textarea
          className="form-textarea"
          placeholder="Additional Notes/Comments"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={4}
        />

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Case' : 'Create Case')}
        </button>
      </div>

      {snackbarVisible && (
        <div className="snackbar">
          {snackbarMessage}
        </div>
      )}
    </div>
  );
}
