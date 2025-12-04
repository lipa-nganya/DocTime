import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PacmanGame from '../components/PacmanGame';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user: authUser, setUser } = useAuth();
  const [prefix, setPrefix] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPacman, setShowPacman] = useState(false);
  const typedKeysRef = useRef('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only track if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      typedKeysRef.current += key;
      
      // Keep only last 6 characters
      if (typedKeysRef.current.length > 6) {
        typedKeysRef.current = typedKeysRef.current.slice(-6);
      }

      // Check if "pacman" was typed
      if (typedKeysRef.current.includes('pacman')) {
        setShowPacman(true);
        typedKeysRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      const userData = response.data.user;
      
      setPrefix(userData.prefix || '');
      setPreferredName(userData.preferredName || '');
      setPhoneNumber(userData.phoneNumber || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferredName.trim()) {
      setError('Preferred name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await api.put('/auth/profile', {
        prefix: prefix || null,
        preferredName: preferredName.trim()
      });

      // Update auth context with new user data
      const updatedUser = {
        ...authUser,
        prefix: response.data.user.prefix,
        preferredName: response.data.user.preferredName
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const prefixOptions = [
    { value: '', label: 'None' },
    { value: 'Dr.', label: 'Dr.' },
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Ms.', label: 'Ms.' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Prof.', label: 'Prof.' }
  ];

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-text">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h2 className="profile-title">Profile</h2>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input form-input-disabled"
              value={phoneNumber}
              disabled
              readOnly
            />
            <p className="form-hint">Phone number cannot be changed</p>
          </div>

          <div className="form-group">
            <label className="form-label">Prefix</label>
            <select
              className="form-select"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            >
              {prefixOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your preferred name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
            />
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {message && (
            <div className="success-message">{message}</div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !preferredName.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="easter-egg-hint">
          <p className="easter-egg-text">Open Keyboard and type "pacman"</p>
        </div>
      </div>

      {showPacman && (
        <PacmanGame onClose={() => setShowPacman(false)} />
      )}
    </div>
  );
}

