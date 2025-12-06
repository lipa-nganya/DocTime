import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertModal from '../components/AlertModal';
import { getApiBaseUrl } from '../services/environment';

// Function to get the current API base URL (supports local/cloud switching)
const getCurrentApiUrl = () => {
  let url = process.env.REACT_APP_API_URL || getApiBaseUrl();
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

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    loadUsers();
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [startDate, endDate, selectedUserId, selectedAction]);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/users`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }
      if (selectedAction) {
        params.append('action', selectedAction);
      }
      
      const queryString = params.toString();
      const url = `${getCurrentApiUrl()}/admin/logs${queryString ? `?${queryString}` : ''}`;
      const response = await axios.get(url);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      setAlertMessage('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
    setSelectedAction('');
  };

  const formatUserName = (user) => {
    if (!user) return 'System';
    const parts = [];
    if (user.prefix) parts.push(user.prefix);
    if (user.preferredName) parts.push(user.preferredName);
    if (parts.length > 0) {
      return `${parts.join(' ')} (${user.phoneNumber})`;
    }
    return user.phoneNumber || 'Unknown';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get unique actions for filter
  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="logs">
      <h2>Activity Logs</h2>
      
      <div className="logs-filters" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              End Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              User:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatUserName(user)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Action:
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(startDate || endDate || selectedUserId || selectedAction) && (
          <button 
            onClick={handleClearFilters}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#FF6B6B', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No logs found for the selected filters.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{formatUserName(log.user)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {formatAction(log.action)}
                    </td>
                    <td>{log.entityType || '-'}</td>
                    <td>{log.description || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginTop: '20px',
              gap: '10px'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm"
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#ccc' : '#4ECDC4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              <span style={{ padding: '0 10px' }}>
                Page {currentPage} of {totalPages} ({logs.length} total logs)
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm"
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#ccc' : '#4ECDC4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
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

