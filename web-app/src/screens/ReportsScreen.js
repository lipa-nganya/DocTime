import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CalendarPicker from '../components/CalendarPicker';
import './ReportsScreen.css';

export default function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const loadReports = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }
      
      const queryString = params.toString();
      const url = `/reports${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="reports-container">
        <div className="loading-text">No reports available</div>
      </div>
    );
  }

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="reports-container">
      <div className="reports-filters">
        <h3 className="filters-title">Filter by Date Range</h3>
        <div className="date-filters">
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
          {(startDate || endDate) && (
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        {(startDate || endDate) && (
          <div className="active-filter-indicator">
            <span className="filter-text">
              Showing data from{' '}
              {startDate ? formatDateForDisplay(startDate) : 'beginning'} to{' '}
              {endDate ? formatDateForDisplay(endDate) : 'today'}
            </span>
          </div>
        )}
      </div>
      <div className="reports-scroll">
        <div className="report-card">
          <h3 className="card-title">Case Statistics</h3>
          <div className="stat-row">
            <span className="stat-label">Completed Cases</span>
            <span className="stat-value">{reports.completedCases}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Cancelled Cases</span>
            <span className="stat-value">{reports.cancelledCases}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Referred Cases</span>
            <span className="stat-value">{reports.referredCases}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Auto-completed Cases</span>
            <span className="stat-value">{reports.autoCompletedCases}</span>
          </div>
          {reports.upcomingCases !== null && reports.upcomingCases !== undefined && (
            <div className="stat-row">
              <span className="stat-label">Upcoming Cases</span>
              <span className="stat-value">{reports.upcomingCases}</span>
            </div>
          )}
        </div>

        <div className="report-card">
          <h3 className="card-title">Financial Summary</h3>
          <div className="stat-row">
            <span className="stat-label">Total Invoiced</span>
            <span className="stat-value">KES {reports.invoicedAmount?.toLocaleString() || 0}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Uninvoiced</span>
            <span className="stat-value">KES {reports.uninvoicedAmount?.toLocaleString() || 0}</span>
          </div>
        </div>

        {reports.surgeonsAnalysis && reports.surgeonsAnalysis.length > 0 && (
          <div className="report-card">
            <h3 className="card-title">Surgeons Worked With</h3>
            {reports.surgeonsAnalysis.map((surgeon) => (
              <div key={surgeon.id} className="surgeon-row">
                <span className="surgeon-name">{surgeon.name}</span>
                <span className="surgeon-count">{surgeon.casesCount} cases</span>
              </div>
            ))}
          </div>
        )}

        {reports.facilitiesAnalysis && reports.facilitiesAnalysis.length > 0 && (
          <div className="report-card">
            <h3 className="card-title">Facilities</h3>
            {reports.facilitiesAnalysis.map((facility, index) => (
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
    </div>
  );
}
