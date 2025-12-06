import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertModal from '../components/AlertModal';
import { getCurrentApiUrl } from '../App';
import './CsvUploadScreen.css';

export default function CsvUploadScreen() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/users`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setAlertMessage('Failed to load users');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setUploadResult(null);
      } else {
        setAlertMessage('Please select a CSV file');
        e.target.value = ''; // Clear file input
      }
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setAlertMessage('Please select a CSV file');
      return;
    }

    if (!selectedUserId) {
      setAlertMessage('Please select a user');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('userId', selectedUserId);

      const response = await axios.post(
        `${getCurrentApiUrl()}/admin/cases/upload-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResult(response.data);
      setAlertMessage(response.data.message || 'CSV uploaded successfully!');
      setCsvFile(null);
      document.querySelector('input[type="file"]').value = ''; // Clear file input
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setAlertMessage(error.response?.data?.error || error.response?.data?.message || 'Failed to upload CSV');
      if (error.response?.data?.results) {
        setUploadResult(error.response.data);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="csv-upload-screen">
      <h2>Upload Completed Cases (CSV)</h2>

      <div className="upload-instructions">
        <h3>CSV Format Requirements</h3>
        <p><strong>Required columns:</strong></p>
        <ul>
          <li><strong>Date of Procedure</strong> - Format: MM/DD/YYYY (e.g., 3/31/2025)</li>
          <li><strong>Patient Name</strong> - Full patient name</li>
        </ul>
        <p><strong>Optional columns:</strong></p>
        <ul>
          <li><strong>In-patient Number</strong></li>
          <li><strong>Patient Age</strong> - Number or text (e.g., "2 years 3 months")</li>
          <li><strong>Amount</strong> - Number without commas (e.g., 50000)</li>
          <li><strong>Payment Status</strong> - Pending, Paid, Partially Paid, Pro Bono, or Cancelled</li>
          <li><strong>Additional Notes</strong> - Any comments or notes</li>
        </ul>
        <p className="note">All uploaded cases will be marked as <strong>Completed</strong> status.</p>
      </div>

      <div className="upload-form">
        <div className="form-group">
          <label>Select User *</label>
          <select
            className="form-input"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={uploading}
          >
            <option value="">-- Select User --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.phoneNumber} {user.prefix ? `(${user.prefix} ${user.preferredName || ''})`.trim() : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select CSV File *</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
          />
          {csvFile && (
            <p className="file-name">Selected: {csvFile.name}</p>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!csvFile || !selectedUserId || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      {uploadResult && (
        <div className="upload-results">
          <h3>Upload Results</h3>
          <div className="result-stats">
            <div className="stat-item success">
              <span className="stat-label">Inserted:</span>
              <span className="stat-value">{uploadResult.results?.inserted || 0}</span>
            </div>
            <div className="stat-item warning">
              <span className="stat-label">Skipped:</span>
              <span className="stat-value">{uploadResult.results?.skipped || 0}</span>
            </div>
            <div className="stat-item error">
              <span className="stat-label">Errors:</span>
              <span className="stat-value">{uploadResult.results?.errors || 0}</span>
            </div>
          </div>

          {uploadResult.results?.errorDetails && uploadResult.results.errorDetails.length > 0 && (
            <div className="error-details">
              <h4>Error Details:</h4>
              <ul>
                {uploadResult.results.errorDetails.map((detail, index) => (
                  <li key={index}>
                    <strong>{detail.patientName}:</strong> {detail.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          title={alertMessage.includes('successfully') ? 'Success' : 'Error'}
        />
      )}
    </div>
  );
}

