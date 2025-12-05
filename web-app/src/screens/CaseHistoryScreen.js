import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AlertModal from '../components/AlertModal';
import './CaseHistoryScreen.css';

export default function CaseHistoryScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('completed');
  const [completedCases, setCompletedCases] = useState([]);
  const [cancelledCases, setCancelledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const [completedRes, cancelledRes] = await Promise.all([
        api.get('/cases/history/completed'),
        api.get('/cases/history/cancelled')
      ]);

      setCompletedCases(completedRes.data.cases || []);
      setCancelledCases(cancelledRes.data.cases || []);
    } catch (error) {
      console.error('Error loading cases:', error);
      setAlertMessage('Failed to load case history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  const handleCasePress = (caseItem) => {
    navigate(`/case/${caseItem.id}`);
  };

  const handleGenerateInvoice = async (caseId, e) => {
    e.stopPropagation();
    try {
      // Fetch PDF through API service to include authentication token
      const response = await api.get(`/invoices/${caseId}/pdf`, {
        responseType: 'blob' // Important: tell axios to expect binary data
      });
      
      // Check if response is actually a PDF (not an error JSON)
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        // Response might be an error JSON, try to parse it
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to generate invoice');
        } catch (parseError) {
          throw new Error('Server returned invalid response');
        }
      }
      
      // Create blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open(url, '_blank');
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // If popup was blocked, trigger download instead
      if (!newWindow) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${caseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to generate invoice';
      setAlertMessage(errorMessage);
    }
  };

  const handleRestoreCase = async (caseId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/cases/${caseId}/restore`);
      setAlertMessage('Case restored successfully');
      loadCases();
    } catch (error) {
      setAlertMessage(error.response?.data?.error || 'Failed to restore case');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cases = tab === 'completed' ? completedCases : cancelledCases;

  return (
    <div className="case-history-container">
      <div className="tab-buttons">
        <button
          className={`tab-button ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed
        </button>
        <button
          className={`tab-button ${tab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setTab('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="case-history-scroll">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">No {tab} cases</p>
          </div>
        ) : (
          <div className="cases-list">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="case-card"
                onClick={() => handleCasePress(caseItem)}
              >
                <h3 className="patient-name">{caseItem.patientName}</h3>
                <p className="case-date">{formatDate(caseItem.dateOfProcedure)}</p>
                {caseItem.facility && (
                  <p className="case-facility">{caseItem.facility.name}</p>
                )}
                {caseItem.amount && (
                  <p className="case-amount">KES {caseItem.amount}</p>
                )}
                {tab === 'completed' && (
                  <div className={`status-label ${caseItem.isAutoCompleted ? 'auto-completed' : ''}`}>
                    <span className="status-text">
                      Status: {caseItem.isAutoCompleted ? 'Auto completed' : (caseItem.status || 'Completed')}
                    </span>
                  </div>
                )}
                {tab === 'cancelled' && (
                  <button
                    className="btn btn-primary"
                    onClick={(e) => handleRestoreCase(caseItem.id, e)}
                  >
                    Restore Case
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
