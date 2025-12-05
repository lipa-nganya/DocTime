import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertModal from '../components/AlertModal';
import { getApiBaseUrl } from '../services/environment';

// Function to get the current API base URL
const getCurrentApiUrl = () => {
  let url = process.env.REACT_APP_API_URL || getApiBaseUrl();
  if (!url.endsWith('/api')) {
    if (url.endsWith('/')) {
      url = `${url}api`;
    } else {
      url = `${url}/api`;
    }
  }
  return url;
};

const ROLE_OPTIONS = [
  { label: 'Surgeon', value: 'Surgeon' },
  { label: 'Assistant Surgeon', value: 'Assistant Surgeon' },
  { label: 'Anaesthetist', value: 'Anaesthetist' },
  { label: 'Assistant Anaesthetist', value: 'Assistant Anaesthetist' },
  { label: 'Other', value: 'Other' }
];

export default function TeamMembersScreen() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'Surgeon', 
    otherRole: '', 
    phoneNumber: '' 
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/team-members`);
      setTeamMembers(response.data.teamMembers || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      setAlertMessage('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', role: 'Surgeon', otherRole: '', phoneNumber: '' });
    setShowAddForm(true);
    setEditingMember(null);
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      role: member.role,
      otherRole: member.otherRole || '',
      phoneNumber: member.phoneNumber || ''
    });
    setShowAddForm(true);
    setEditingMember(member);
  };

  const handleDelete = (member) => {
    setDeletingId(member.id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await axios.delete(`${getCurrentApiUrl()}/team-members/${deletingId}`);
      setAlertMessage('Team member deleted successfully');
      setDeletingId(null);
      loadTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to delete team member');
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setAlertMessage('Name is required');
      return;
    }

    if (formData.role === 'Other' && !formData.otherRole.trim()) {
      setAlertMessage('Other role description is required when role is "Other"');
      return;
    }

    try {
      if (editingMember) {
        await axios.put(`${getCurrentApiUrl()}/team-members/${editingMember.id}`, formData);
        setAlertMessage('Team member updated successfully');
      } else {
        await axios.post(`${getCurrentApiUrl()}/team-members`, formData);
        setAlertMessage('Team member added successfully');
      }
      setShowAddForm(false);
      setEditingMember(null);
      setFormData({ name: '', role: 'Surgeon', otherRole: '', phoneNumber: '' });
      loadTeamMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to save team member');
    }
  };

  if (loading) {
    return <div className="team-members-screen"><p>Loading team members...</p></div>;
  }

  return (
    <div className="team-members-screen">
      <div className="screen-header">
        <h2>Team Members Management</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          Add New Team Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <p>No team members found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Other Role</th>
              <th>Phone Number</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.otherRole || '-'}</td>
                <td>{member.phoneNumber || '-'}</td>
                <td>
                  <span className={`badge ${member.isSystemDefined ? 'system' : 'user'}`}>
                    {member.isSystemDefined ? 'System' : 'User'}
                  </span>
                </td>
                <td className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(member)}>
                    Edit
                  </button>
                  {!member.isSystemDefined && (
                    <button className="btn btn-delete" onClick={() => handleDelete(member)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingMember ? 'Edit Team Member' : 'Add New Team Member'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, otherRole: e.target.value !== 'Other' ? '' : formData.otherRole })}
                  required
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.role === 'Other' && (
                <div className="form-group">
                  <label>Other Role Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.otherRole}
                    onChange={(e) => setFormData({ ...formData, otherRole: e.target.value })}
                    placeholder="e.g., Cath Lab, Cardiac Team"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Save Changes' : 'Add Team Member'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMember(null);
                    setFormData({ name: '', role: 'Surgeon', otherRole: '', phoneNumber: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <AlertModal
          title="Confirm Delete"
          message="Are you sure you want to delete this team member? This action cannot be undone."
          onClose={() => setDeletingId(null)}
          onConfirm={confirmDelete}
          confirmText="Delete"
          showCancel={true}
        />
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

