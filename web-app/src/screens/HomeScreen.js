import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import AlertModal from '../components/AlertModal';
import CalendarPicker from '../components/CalendarPicker';
import './HomeScreen.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      loadCases();
    }
  }, [location]);

  const loadCases = async () => {
    try {
      const response = await api.get('/cases/upcoming');
      const casesData = response.data.cases || response.data.data?.cases || [];
      setAllCases(casesData);
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load cases';
      setAlertMessage(errorMessage);
      setAllCases([]);
      setCases([]);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter cases based on search query and date range
  const filteredCases = useMemo(() => {
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
  }, [allCases, searchQuery, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <div className="home-container">
      <div className="home-scroll">
        <h2 className="section-title">Upcoming Cases</h2>
        
        <div className="home-filters">
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
        
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : filteredCases.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">
              {allCases.length === 0 
                ? 'No upcoming cases' 
                : 'No cases match your filters'}
            </p>
          </div>
        ) : (
          <div className="cases-list">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="case-card"
                onClick={() => handleCasePress(caseItem)}
              >
                <h3 className="patient-name">{caseItem.patientName}</h3>
                <p className="case-date">{formatDate(caseItem.dateOfProcedure)}</p>
                <p className="case-facility">
                  {caseItem.facility?.name || 'No facility'}
                </p>
                {caseItem.isReferred && (
                  <span className="referral-tag">Referred</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="fab"
        onClick={() => navigate('/new-case')}
        title="New Case"
      >
        +
      </button>

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          title="Error"
        />
      )}
    </div>
  );
}
