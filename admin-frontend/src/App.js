import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogsScreen from './screens/LogsScreen';
import FacilitiesScreen from './screens/FacilitiesScreen';
import PayersScreen from './screens/PayersScreen';
import TeamMembersScreen from './screens/TeamMembersScreen';
import AlertModal from './components/AlertModal';
import { getApiBaseUrl } from './services/environment';
import './App.css';

// Function to get the current API base URL (supports local/cloud switching)
// Ensures the URL always includes /api
const getAPIBaseURL = () => {
  // In production, always use the build-time environment variable
  // In development, allow runtime switching via environment service
  let url;
  if (process.env.REACT_APP_API_URL) {
    // Build-time configuration (production)
    url = process.env.REACT_APP_API_URL;
  } else {
    // Runtime configuration (development)
    url = getApiBaseUrl();
  }
  
  // Ensure URL ends with /api
  if (!url.endsWith('/api')) {
    if (url.endsWith('/')) {
      url = `${url}api`;
    } else {
      url = `${url}/api`;
    }
  }
  
  return url;
};

// Export a function that always gets the current API URL
// This ensures we always use the latest environment setting
const getCurrentApiUrl = () => getAPIBaseURL();

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Add timeout to prevent hanging
      const response = await axios.get(`${getCurrentApiUrl()}/admin/dashboard`, {
        timeout: 10000 // 10 second timeout
      });
      if (response.data && response.data.dashboard) {
        setStats(response.data.dashboard);
      } else {
        setStats({
          completedCases: 0,
          cancelledCases: 0,
          referredCases: 0,
          ongoingCases: 0,
          totalUsers: 0,
          activeUsers: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Always set stats to 0 values on error and stop loading
      setStats({
        completedCases: 0,
        cancelledCases: 0,
        referredCases: 0,
        ongoingCases: 0,
        totalUsers: 0,
        activeUsers: 0
      });
    } finally {
      // Always stop loading, even on error
      setLoading(false);
    }
  };

  if (loading || !stats) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Ongoing Cases</h3>
          <p className="stat-value">{stats.ongoingCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Cases</h3>
          <p className="stat-value">{stats.completedCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Cancelled Cases</h3>
          <p className="stat-value">{stats.cancelledCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Referred Cases</h3>
          <p className="stat-value">{stats.referredCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users (30 days)</h3>
          <p className="stat-value">{stats.activeUsers || 0}</p>
        </div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      prefix: user.prefix || '',
      preferredName: user.preferredName || '',
      role: user.role || '',
      otherRole: user.otherRole || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      await axios.put(`${getCurrentApiUrl()}/admin/users/${editingUser.id}`, editForm);
      setEditingUser(null);
      setEditForm({});
      loadUsers();
      setAlertMessage('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      setAlertMessage('Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  if (loading) return <div>Loading...</div>;

  // Helper function to format user name from prefix and preferredName
  const formatUserName = (user) => {
    if (!user) return 'N/A';
    const parts = [];
    if (user.prefix) parts.push(user.prefix);
    if (user.preferredName) parts.push(user.preferredName);
    const name = parts.join(' ').trim();
    return name || 'N/A';
  };

  const roleOptions = ['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'];
  const prefixOptions = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.'];

  return (
    <div className="users">
      <h2>Users</h2>
      {alertMessage && (
        <div className="alert" style={{ marginBottom: '20px', padding: '10px', backgroundColor: alertMessage.includes('success') ? '#d4edda' : '#f8d7da', color: alertMessage.includes('success') ? '#155724' : '#721c24', borderRadius: '4px' }}>
          {alertMessage}
          <button onClick={() => setAlertMessage(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Phone Number</th>
            <th>Name</th>
            <th>Role</th>
            <th>Signup OTP</th>
            <th>Last Login</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.phoneNumber}</td>
              <td>{formatUserName(user)}</td>
              <td>{user.role}{user.otherRole ? ` (${user.otherRole})` : ''}</td>
              <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#4ECDC4' }}>
                {user.signupOTP || '-'}
              </td>
              <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-edit" onClick={() => handleEdit(user)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit User: {editingUser.phoneNumber}</h3>
            <div className="edit-form">
              <label>
                Prefix:
                <select
                  value={editForm.prefix}
                  onChange={(e) => setEditForm({...editForm, prefix: e.target.value})}
                >
                  <option value="">-- Select Prefix --</option>
                  {prefixOptions.map(prefix => (
                    <option key={prefix} value={prefix}>{prefix}</option>
                  ))}
                </select>
              </label>
              <label>
                Preferred Name:
                <input
                  type="text"
                  value={editForm.preferredName}
                  onChange={(e) => setEditForm({...editForm, preferredName: e.target.value})}
                  placeholder="Enter preferred name"
                />
              </label>
              <label>
                Role:
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                >
                  <option value="">-- Select Role --</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              {editForm.role === 'Other' && (
                <label>
                  Other Role:
                  <input
                    type="text"
                    value={editForm.otherRole}
                    onChange={(e) => setEditForm({...editForm, otherRole: e.target.value})}
                    placeholder="Specify role"
                  />
                </label>
              )}
            </div>
            <div className="edit-actions">
              <button onClick={handleSaveEdit}>Save</button>
              <button onClick={handleCancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cases() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [ongoingCases, setOngoingCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [cancelledCases, setCancelledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCase, setEditingCase] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedCases, setSelectedCases] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [moving, setMoving] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadCases();
    loadUsers();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/users`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCases = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ongoing') {
        const response = await axios.get(`${getCurrentApiUrl()}/admin/ongoing-cases`);
        const cases = response.data.cases || [];
        // Debug: log first case to see user structure
        if (cases.length > 0 && cases[0].user) {
          console.log('Sample case user data:', {
            id: cases[0].user.id,
            phoneNumber: cases[0].user.phoneNumber,
            prefix: cases[0].user.prefix,
            preferredName: cases[0].user.preferredName,
            fullUser: cases[0].user
          });
        }
        setOngoingCases(cases);
      } else if (activeTab === 'completed') {
        const response = await axios.get(`${getCurrentApiUrl()}/admin/completed-cases`);
        const cases = response.data.cases || [];
        if (cases.length > 0 && cases[0].user) {
          console.log('Sample case user data:', {
            id: cases[0].user.id,
            phoneNumber: cases[0].user.phoneNumber,
            prefix: cases[0].user.prefix,
            preferredName: cases[0].user.preferredName,
            fullUser: cases[0].user
          });
        }
        setCompletedCases(cases);
      } else if (activeTab === 'cancelled') {
        const response = await axios.get(`${getCurrentApiUrl()}/admin/cancelled-cases`);
        const cases = response.data.cases || [];
        if (cases.length > 0 && cases[0].user) {
          console.log('Sample case user data:', {
            id: cases[0].user.id,
            phoneNumber: cases[0].user.phoneNumber,
            prefix: cases[0].user.prefix,
            preferredName: cases[0].user.preferredName,
            fullUser: cases[0].user
          });
        }
        setCancelledCases(cases);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      // Set empty arrays on error to prevent undefined issues
      if (activeTab === 'ongoing') {
        setOngoingCases([]);
      } else if (activeTab === 'completed') {
        setCompletedCases([]);
      } else if (activeTab === 'cancelled') {
        setCancelledCases([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setEditForm({
      patientName: caseItem.patientName || '',
      dateOfProcedure: caseItem.dateOfProcedure ? new Date(caseItem.dateOfProcedure).toISOString().split('T')[0] : '',
      patientAge: caseItem.patientAge || '',
      inpatientNumber: caseItem.inpatientNumber || '',
      amount: caseItem.amount || '',
      paymentStatus: caseItem.paymentStatus || 'Pending',
      additionalNotes: caseItem.additionalNotes || '',
      status: caseItem.status || 'Upcoming'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;
    
    try {
      await axios.put(`${getCurrentApiUrl()}/admin/cases/${editingCase.id}`, editForm);
      setEditingCase(null);
      setEditForm({});
      loadCases();
      setAlertMessage('Case updated successfully');
    } catch (error) {
      console.error('Error updating case:', error);
      setAlertMessage('Failed to update case');
    }
  };

  const handleCancelEdit = () => {
    setEditingCase(null);
    setEditForm({});
  };

  const handleSelectCase = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(cases.map(c => c.id));
    }
  };

  const handleMoveCases = async () => {
    if (selectedCases.length === 0) {
      setAlertMessage('Please select at least one case to move');
      return;
    }

    if (!targetUserId) {
      setAlertMessage('Please select a target user');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to move ${selectedCases.length} case(s) to the selected user?`
    );

    if (!confirmed) return;

    setMoving(true);
    try {
      const response = await axios.post(`${getCurrentApiUrl()}/admin/cases/move`, {
        caseIds: selectedCases,
        targetUserId
      });

      setAlertMessage(response.data.message || 'Cases moved successfully');
      setSelectedCases([]);
      setShowMoveModal(false);
      setTargetUserId('');
      loadCases();
    } catch (error) {
      console.error('Error moving cases:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to move cases');
    } finally {
      setMoving(false);
    }
  };

  const cases = activeTab === 'ongoing' ? ongoingCases : 
                activeTab === 'completed' ? completedCases : 
                cancelledCases;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="cases">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Cases</h2>
        {selectedCases.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>{selectedCases.length} case(s) selected</span>
            <button 
              className="move-button"
              onClick={() => setShowMoveModal(true)}
            >
              Move to User
            </button>
            <button 
              className="cancel-selection-button"
              onClick={() => setSelectedCases([])}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button 
          className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {editingCase && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Case</h3>
            <div className="edit-form">
              <label>
                Patient Name:
                <input
                  type="text"
                  value={editForm.patientName}
                  onChange={(e) => setEditForm({...editForm, patientName: e.target.value})}
                />
              </label>
              <label>
                Date of Procedure:
                <input
                  type="date"
                  value={editForm.dateOfProcedure}
                  onChange={(e) => setEditForm({...editForm, dateOfProcedure: e.target.value})}
                />
              </label>
              <label>
                Patient Age:
                <input
                  type="number"
                  value={editForm.patientAge}
                  onChange={(e) => setEditForm({...editForm, patientAge: e.target.value})}
                />
              </label>
              <label>
                In-patient Number:
                <input
                  type="text"
                  value={editForm.inpatientNumber}
                  onChange={(e) => setEditForm({...editForm, inpatientNumber: e.target.value})}
                />
              </label>
              <label>
                Amount:
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                />
              </label>
              <label>
                Payment Status:
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pro Bono">Pro Bono</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              <label>
                Status:
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Referred">Referred</option>
                </select>
              </label>
              <label>
                Additional Notes:
                <textarea
                  value={editForm.additionalNotes}
                  onChange={(e) => setEditForm({...editForm, additionalNotes: e.target.value})}
                  rows={4}
                />
              </label>
            </div>
            <div className="edit-actions">
              <button onClick={handleSaveEdit}>Save</button>
              <button onClick={handleCancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {cases.length === 0 ? (
        <p>No {activeTab} cases found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCases.length === cases.length && cases.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Patient Name</th>
              <th>Date of Procedure</th>
              <th>Patient Age</th>
              <th>Doctor</th>
              <th>Case Owner</th>
              <th>Facility</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(caseItem.id)}
                    onChange={() => handleSelectCase(caseItem.id)}
                  />
                </td>
                <td>{caseItem.patientName}</td>
                <td>{new Date(caseItem.dateOfProcedure).toLocaleDateString()}</td>
                <td>{caseItem.patientAge || 'N/A'}</td>
                <td>{caseItem.user?.phoneNumber || 'N/A'}</td>
                <td>
                  {(() => {
                    if (!caseItem.user) return 'N/A';
                    
                    const prefix = caseItem.user.prefix;
                    const preferredName = caseItem.user.preferredName;
                    
                    // Debug log for troubleshooting
                    if (!prefix && !preferredName) {
                      console.log('User missing prefix/preferredName:', {
                        userId: caseItem.user.id,
                        phoneNumber: caseItem.user.phoneNumber,
                        user: caseItem.user
                      });
                    }
                    
                    // Build name from prefix and preferredName
                    const parts = [];
                    if (prefix) parts.push(prefix);
                    if (preferredName) parts.push(preferredName);
                    
                    const name = parts.join(' ').trim();
                    return name || 'N/A';
                  })()}
                </td>
                <td>{caseItem.facility?.name || 'N/A'}</td>
                <td>{caseItem.status}</td>
                <td>{caseItem.amount ? `KES ${caseItem.amount}` : 'N/A'}</td>
                <td>{caseItem.paymentStatus || 'N/A'}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEdit(caseItem)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showMoveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Move Cases to Another User</h3>
            <p>Moving {selectedCases.length} case(s)</p>
            <label>
              Select Target User:
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.phoneNumber} {user.prefix ? `(${user.prefix} ${user.preferredName || ''})`.trim() : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleMoveCases}
                disabled={!targetUserId || moving}
                className="move-button"
              >
                {moving ? 'Moving...' : 'Move Cases'}
              </button>
              <button 
                onClick={() => {
                  setShowMoveModal(false);
                  setTargetUserId('');
                }}
                disabled={moving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}

function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/referrals`);
      setReferrals(response.data.referrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="referrals">
      <h2>Referrals</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Referrer</th>
            <th>Referee</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id}>
              <td>{referral.case?.patientName}</td>
              <td>{referral.referrer?.phoneNumber}</td>
              <td>{referral.referee?.phoneNumber || referral.refereePhoneNumber}</td>
              <td>{referral.status}</td>
              <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newName, setNewName] = useState('');
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/roles`);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error loading roles:', error);
      setAlertMessage('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedRole || !newName.trim()) return;

    try {
      await axios.post(`${getCurrentApiUrl()}/admin/roles/${selectedRole.name}/team-members`, {
        names: [newName.trim()]
      });
      setNewName('');
      setSelectedRole(null);
      loadRoles();
      setAlertMessage('Team member added successfully');
    } catch (error) {
      console.error('Error adding team member:', error);
      setAlertMessage('Failed to add team member');
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await axios.delete(`${getCurrentApiUrl()}/admin/roles/${roleToDelete.id}`);
      setRoleToDelete(null);
      loadRoles();
      setAlertMessage('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete role';
      setAlertMessage(errorMessage);
    }
  };

  const handleRemoveTeamMember = async (role, memberName) => {
    if (!window.confirm(`Remove "${memberName}" from ${role.name}?`)) {
      return;
    }

    try {
      const currentNames = role.teamMemberNames || [];
      const updatedNames = currentNames.filter(name => name !== memberName);
      
      // We need to update the role with the new list
      // Since there's no specific endpoint, we'll need to add one or use a workaround
      // For now, let's add a PUT endpoint for updating team members
      await axios.put(`${getCurrentApiUrl()}/admin/roles/${role.id}/team-members`, {
        names: updatedNames
      });
      loadRoles();
      setAlertMessage('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      setAlertMessage('Failed to remove team member');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="roles">
      <h2>Roles & Team Members</h2>
      {roles.length === 0 ? (
        <p>No roles found.</p>
      ) : (
        roles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              <button 
                className="delete-role-button"
                onClick={() => setRoleToDelete(role)}
                title="Delete role"
              >
                ×
              </button>
            </div>
            <div className="add-member-section">
              <input
                type="text"
                placeholder="Add team member name"
                value={selectedRole?.id === role.id ? newName : ''}
                onChange={(e) => {
                  setSelectedRole(role);
                  setNewName(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTeamMember();
                  }
                }}
              />
              <button onClick={handleAddTeamMember}>Add</button>
            </div>
            {role.teamMemberNames && role.teamMemberNames.length > 0 ? (
              <ul className="team-members-list">
                {role.teamMemberNames.map((name, index) => (
                  <li key={index}>
                    <span>{name}</span>
                    <button 
                      className="remove-member-button"
                      onClick={() => handleRemoveTeamMember(role, name)}
                      title="Remove team member"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-members">No team members added yet</p>
            )}
          </div>
        ))
      )}

      {roleToDelete && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Delete Role</h3>
            <p>Are you sure you want to delete the role <strong>"{roleToDelete.name}"</strong>?</p>
            {roleToDelete.teamMemberNames && roleToDelete.teamMemberNames.length > 0 && (
              <p className="warning">
              ⚠️ This role has {roleToDelete.teamMemberNames.length} team member(s). They will also be removed.
            </p>
            )}
            <div className="delete-modal-actions">
              <button className="confirm-delete" onClick={handleDeleteRole}>
                Delete
              </button>
              <button className="cancel-delete" onClick={() => setRoleToDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}

function AdminReports() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadReports();
    } else {
      setReports(null);
    }
  }, [selectedUserId, startDate, endDate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    if (!selectedUserId) return;
    
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }
      
      const queryString = params.toString();
      const url = `${getCurrentApiUrl()}/admin/reports/${selectedUserId}${queryString ? `?${queryString}` : ''}`;
      const response = await axios.get(url);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
      setAlertMessage('Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatUserName = (user) => {
    const parts = [];
    if (user.prefix) parts.push(user.prefix);
    if (user.preferredName) parts.push(user.preferredName);
    return parts.length > 0 ? parts.join(' ') : null;
  };

  const formatUserDisplay = (user) => {
    const name = formatUserName(user);
    const roleText = user.role ? `(${user.role}${user.otherRole ? ` - ${user.otherRole}` : ''})` : '';
    
    if (name) {
      return `${name} - ${user.phoneNumber} ${roleText}`;
    }
    return `${user.phoneNumber} ${roleText}`;
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="admin-reports">
      <h2>User Reports</h2>
      
      <div className="reports-filters">
        <div className="filter-group">
          <label>
            Select User:
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="user-select"
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatUserDisplay(user)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedUserId && (
          <>
            <div className="filter-group">
              <label>
                Start Date:
                <input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </label>
            </div>
            <div className="filter-group">
              <label>
                End Date:
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </label>
            </div>
            {(startDate || endDate) && (
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Clear Date Filters
              </button>
            )}
          </>
        )}
      </div>

      {reportsLoading && <div>Loading reports...</div>}

      {reports && !reportsLoading && (
        <div className="reports-content">
          <div className="user-info">
            <h3>
              Reports for: {formatUserName(reports.user) || reports.user.phoneNumber}
              {formatUserName(reports.user) && ` (${reports.user.phoneNumber})`}
            </h3>
            {reports.user.role && (
              <p>Role: {reports.user.role}{reports.user.otherRole ? ` - ${reports.user.otherRole}` : ''}</p>
            )}
            {(startDate || endDate) && (
              <p className="date-range">
                Date Range: {startDate ? formatDateForDisplay(startDate) : 'Beginning'} to {endDate ? formatDateForDisplay(endDate) : 'Today'}
              </p>
            )}
          </div>

          <div className="report-card">
            <h3 className="card-title">Case Statistics</h3>
            <div className="stat-row">
              <span className="stat-label">Completed Cases</span>
              <span className="stat-value">{reports.reports.completedCases}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Cancelled Cases</span>
              <span className="stat-value">{reports.reports.cancelledCases}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Referred Cases</span>
              <span className="stat-value">{reports.reports.referredCases}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Auto-completed Cases</span>
              <span className="stat-value">{reports.reports.autoCompletedCases}</span>
            </div>
          </div>

          <div className="report-card">
            <h3 className="card-title">Financial Summary</h3>
            <div className="stat-row">
              <span className="stat-label">Total Invoiced</span>
              <span className="stat-value">KES {reports.reports.invoicedAmount?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Uninvoiced</span>
              <span className="stat-value">KES {reports.reports.uninvoicedAmount?.toLocaleString() || 0}</span>
            </div>
          </div>

          {reports.reports.surgeonsAnalysis && reports.reports.surgeonsAnalysis.length > 0 && (
            <div className="report-card">
              <h3 className="card-title">Surgeons Worked With</h3>
              {reports.reports.surgeonsAnalysis.map((surgeon) => (
                <div key={surgeon.id} className="surgeon-row">
                  <span className="surgeon-name">{surgeon.name}</span>
                  <span className="surgeon-count">{surgeon.casesCount} cases</span>
                </div>
              ))}
            </div>
          )}

          {reports.reports.facilitiesAnalysis && reports.reports.facilitiesAnalysis.length > 0 && (
            <div className="report-card">
              <h3 className="card-title">Facilities</h3>
              {reports.reports.facilitiesAnalysis.map((facility, index) => (
                <div key={index} className="facility-row">
                  <span className="facility-name">{facility.facilityName}</span>
                  <span className="facility-stats">
                    {facility.casesCount} cases • KES {facility.totalAmount?.toLocaleString() || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedUserId && (
        <div className="no-selection">
          <p>Please select a user to view their reports</p>
        </div>
      )}
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}

import OTPSMSSettings from './components/OTPSMSSettings';
import ReferralSMSSettings from './components/ReferralSMSSettings';
import EnvironmentSettings from './components/EnvironmentSettings';

function Settings() {
  return (
    <div className="settings">
      <h2>Settings</h2>
      <EnvironmentSettings />
      <div style={{ marginTop: '2rem' }}></div>
      <OTPSMSSettings />
      <div style={{ marginTop: '2rem' }}></div>
      <ReferralSMSSettings />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <h1>Doc Time Admin</h1>
          <Link to="/">Dashboard</Link>
          <Link to="/users">Users</Link>
          <Link to="/cases">Cases</Link>
          <Link to="/referrals">Referrals</Link>
          <Link to="/reports">Reports</Link>
          {/* <Link to="/roles">Roles</Link> */}
          <Link to="/facilities">Facilities</Link>
          <Link to="/payers">Payers</Link>
          <Link to="/team-members">Team Members</Link>
          <Link to="/logs">Logs</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/ongoing-cases" element={<Cases />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/reports" element={<AdminReports />} />
            {/* <Route path="/roles" element={<Roles />} /> */}
            <Route path="/facilities" element={<FacilitiesScreen />} />
            <Route path="/payers" element={<PayersScreen />} />
            <Route path="/team-members" element={<TeamMembersScreen />} />
            <Route path="/logs" element={<LogsScreen />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

