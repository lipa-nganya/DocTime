import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './OnboardingScreen.css';

const ROLES = ['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'];
const PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.'];

export default function OnboardingScreen() {
  const { completeOnboarding, isLoading: authIsLoading } = useAuth();
  
  const [prefix, setPrefix] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [role, setRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefixExpanded, setPrefixExpanded] = useState(false);
  const [error, setError] = useState('');
  
  const isLoading = loading || authIsLoading;

  const showError = (message) => {
    setError(message);
    window.alert(message);
  };

  const handleComplete = async () => {
    if (!preferredName.trim()) {
      showError('Please enter your preferred name');
      return;
    }

    if (!role) {
      showError('Please select your role');
      return;
    }

    if (role === 'Other' && !otherRole.trim()) {
      showError('Please specify your role');
      return;
    }

    if (loading || isLoading) return;

    setError('');
    setLoading(true);

    try {
      await completeOnboarding(prefix, preferredName, role, otherRole);
      window.location.reload();
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Failed to save profile');
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <h1 className="onboarding-title">Welcome to Doc Time</h1>
        <p className="onboarding-subtitle">Let's set up your profile</p>

        {error && (
          <div className="error-text">{error}</div>
        )}

        <label className="section-label">Prefix (Optional)</label>
        <div className="dropdown-container">
          <div
            className="dropdown-header"
            onClick={() => setPrefixExpanded(!prefixExpanded)}
          >
            <input
              type="text"
              className="dropdown-input"
              placeholder="Select prefix"
              value={prefix}
              readOnly
            />
            <span className="dropdown-icon">
              {prefixExpanded ? '▲' : '▼'}
            </span>
          </div>
          
          {prefixExpanded && (
            <div className="dropdown-content">
              <div
                className={`dropdown-option ${!prefix ? 'selected' : ''}`}
                onClick={() => {
                  setPrefix('');
                  setPrefixExpanded(false);
                }}
              >
                None
              </div>
              {PREFIXES.map((p) => (
                <div
                  key={p}
                  className={`dropdown-option ${prefix === p ? 'selected' : ''}`}
                  onClick={() => {
                    setPrefix(p);
                    setPrefixExpanded(false);
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Preferred Name *"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />

        <label className="section-label">What role best describes you?</label>

        <div className="radio-group">
          {ROLES.map((r) => (
            <label key={r} className="radio-row">
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={(e) => setRole(e.target.value)}
              />
              <span className="radio-label">{r}</span>
            </label>
          ))}
        </div>

        {role === 'Other' && (
          <input
            type="text"
            className="form-input"
            placeholder="Specify your role"
            value={otherRole}
            onChange={(e) => setOtherRole(e.target.value)}
          />
        )}

        <button
          className="btn btn-primary"
          onClick={handleComplete}
          disabled={loading || isLoading}
        >
          {loading || isLoading ? 'Saving Profile...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
