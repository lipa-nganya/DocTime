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

export default function PayersScreen() {
  const [payers, setPayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPayer, setEditingPayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [alertMessage, setAlertMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPayers();
  }, []);

  const loadPayers = async () => {
    try {
      // Add cache-busting parameter to avoid browser cache
      const response = await axios.get(`${getCurrentApiUrl()}/payers`, {
        params: { _t: Date.now() }
        // Removed Cache-Control header from request to avoid CORS issues
        // The backend sets Cache-Control in the response, which is fine
      });
      setPayers(response.data.payers || []);
    } catch (error) {
      console.error('Error loading payers:', error);
      setAlertMessage('Failed to load payers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '' });
    setShowAddForm(true);
    setEditingPayer(null);
  };

  const handleEdit = (payer) => {
    setFormData({ name: payer.name });
    setEditingPayer(payer);
    setShowAddForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    const idStr = String(id); // Ensure consistent string comparison
    try {
      await axios.delete(`${getCurrentApiUrl()}/payers/${id}`);
      // Optimistically update the state by removing the deleted payer immediately
      setPayers(prevPayers => prevPayers.filter(p => String(p.id) !== idStr));
      setAlertMessage('Payer deleted successfully');
      // Reload with cache-busting to ensure consistency
      await loadPayers();
    } catch (error) {
      console.error('Error deleting payer:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to delete payer');
      // Reload on error to ensure UI is in sync
      loadPayers();
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setAlertMessage('Please enter a payer name');
      return;
    }

    try {
      if (editingPayer) {
        // Update existing payer
        await axios.put(`${getCurrentApiUrl()}/payers/${editingPayer.id}`, formData);
        setAlertMessage('Payer updated successfully');
      } else {
        // Create new payer
        await axios.post(`${getCurrentApiUrl()}/payers`, formData);
        setAlertMessage('Payer created successfully');
      }
      
      setShowAddForm(false);
      setEditingPayer(null);
      setFormData({ name: '' });
      loadPayers();
    } catch (error) {
      console.error('Error saving payer:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to save payer');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingPayer(null);
    setFormData({ name: '' });
  };

  if (loading) {
    return <div className="screen-container">Loading...</div>;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2>Payers</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Payer
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingPayer ? 'Edit Payer' : 'Add Payer'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Payer Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter payer name"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingPayer ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payers.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-state">No payers found</td>
              </tr>
            ) : (
              payers.map((payer) => (
                <tr key={payer.id}>
                  <td>{payer.name}</td>
                  <td>
                    {payer.isSystemDefined ? (
                      <span className="badge badge-system">System</span>
                    ) : (
                      <span className="badge badge-user">User</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(payer)}
                        title="Edit payer"
                      >
                        Edit
                      </button>
                      {!payer.isSystemDefined && (
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(payer.id, payer.name)}
                          disabled={deletingId === payer.id}
                          title="Delete payer"
                        >
                          {deletingId === payer.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertModal
        message={alertMessage}
        onClose={() => setAlertMessage(null)}
        title={alertMessage?.includes('success') ? 'Success' : 'Error'}
      />
    </div>
  );
}

