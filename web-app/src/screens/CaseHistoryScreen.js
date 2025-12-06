import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AlertModal from '../components/AlertModal';
import CalendarPicker from '../components/CalendarPicker';
import './CaseHistoryScreen.css';

export default function CaseHistoryScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('completed');
  const [completedCases, setCompletedCases] = useState([]);
  const [cancelledCases, setCancelledCases] = useState([]);
  const [allCompletedCases, setAllCompletedCases] = useState([]);
  const [allCancelledCases, setAllCancelledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 7;

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const [completedRes, cancelledRes] = await Promise.all([
        api.get('/cases/history/completed'),
        api.get('/cases/history/cancelled')
      ]);

      const completed = completedRes.data.cases || [];
      const cancelled = cancelledRes.data.cases || [];
      
      setAllCompletedCases(completed);
      setAllCancelledCases(cancelled);
      setCompletedCases(completed);
      setCancelledCases(cancelled);
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

  // Filter cases based on search query and date range
  const filteredCases = useMemo(() => {
    const allCases = tab === 'completed' ? allCompletedCases : allCancelledCases;
    
    return allCases.filter((caseItem) => {
      // Filter by patient name search
      if (searchQuery.trim()) {
        const patientName = (caseItem.patientName || '').toLowerCase();
        if (!patientName.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Filter by date range
      if (startDate || endDate) {
        const caseDate = new Date(caseItem.dateOfProcedure);
        caseDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (caseDate < start) {
            return false;
          }
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (caseDate > end) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tab, allCompletedCases, allCancelledCases, searchQuery, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCases.length / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const endIndex = startIndex + casesPerPage;
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, tab]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

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

      <div className="case-history-filters">
        <div className="search-filter">
          <input
            type="text"
            className="search-input"
            placeholder="Search by patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="date-filters-row">
          <div className="date-filter-item">
            <CalendarPicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div className="date-filter-item">
            <CalendarPicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>
        {(searchQuery || startDate || endDate) && (
          <button className="btn-clear-filters" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="case-history-scroll">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : filteredCases.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">No {tab} cases</p>
          </div>
        ) : (
          <>
            <div className="cases-list">
              {paginatedCases.map((caseItem) => (
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-button"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageClick(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="pagination-button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
            {filteredCases.length > 0 && (
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredCases.length)} of {filteredCases.length} cases
              </div>
            )}
          </>
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
