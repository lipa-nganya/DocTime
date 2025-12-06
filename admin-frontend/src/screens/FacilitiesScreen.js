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

export default function FacilitiesScreen() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFacility, setEditingFacility] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [alertMessage, setAlertMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      // Add cache-busting parameter to avoid browser cache
      const response = await axios.get(`${getCurrentApiUrl()}/facilities`, {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setFacilities(response.data.facilities || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
      setAlertMessage('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '' });
    setShowAddForm(true);
    setEditingFacility(null);
  };

  const handleEdit = (facility) => {
    setFormData({ name: facility.name });
    setEditingFacility(facility);
    setShowAddForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    const idStr = String(id); // Ensure consistent string comparison
    try {
      await axios.delete(`${getCurrentApiUrl()}/facilities/${id}`);
      // Optimistically update the state by removing the deleted facility immediately
      setFacilities(prevFacilities => prevFacilities.filter(f => String(f.id) !== idStr));
      setAlertMessage('Facility deleted successfully');
      // Reload with cache-busting to ensure consistency
      await loadFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to delete facility');
      // Reload on error to ensure UI is in sync
      loadFacilities();
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setAlertMessage('Please enter a facility name');
      return;
    }

    try {
      if (editingFacility) {
        // Update existing facility
        await axios.put(`${getCurrentApiUrl()}/facilities/${editingFacility.id}`, formData);
        setAlertMessage('Facility updated successfully');
      } else {
        // Create new facility
        await axios.post(`${getCurrentApiUrl()}/facilities`, formData);
        setAlertMessage('Facility created successfully');
      }
      
      setShowAddForm(false);
      setEditingFacility(null);
      setFormData({ name: '' });
      loadFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
      setAlertMessage(error.response?.data?.error || 'Failed to save facility');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingFacility(null);
    setFormData({ name: '' });
  };

  if (loading) {
    return <div className="screen-container">Loading...</div>;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2>Facilities</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Facility
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingFacility ? 'Edit Facility' : 'Add Facility'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Facility Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter facility name"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingFacility ? 'Update' : 'Create'}
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
            {facilities.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-state">No facilities found</td>
              </tr>
            ) : (
              facilities.map((facility) => (
                <tr key={facility.id}>
                  <td>{facility.name}</td>
                  <td>
                    {facility.isSystemDefined ? (
                      <span className="badge badge-system">System</span>
                    ) : (
                      <span className="badge badge-user">User</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(facility)}
                        title="Edit facility"
                      >
                        Edit
                      </button>
                      {!facility.isSystemDefined && (
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(facility.id, facility.name)}
                          disabled={deletingId === facility.id}
                          title="Delete facility"
                        >
                          {deletingId === facility.id ? 'Deleting...' : 'Delete'}
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

