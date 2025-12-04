import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './HomeScreen.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load cases';
      window.alert(errorMessage);
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

  return (
    <div className="home-container">
      <div className="home-scroll">
        <h2 className="section-title">Upcoming Cases</h2>
        
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">No upcoming cases</p>
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
    </div>
  );
}
