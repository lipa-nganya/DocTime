import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertModal from './AlertModal';
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

export default function ReferralSMSSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${getCurrentApiUrl()}/admin/settings`);
      setSettings(response.data.settings || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReferralSMS = async () => {
    const referralSmsSetting = settings.find(s => s.key === 'ENABLE_REFERRAL_SMS');
    const newValue = referralSmsSetting?.value === 'true' ? 'false' : 'true';
    
    try {
      await axios.put(`${getCurrentApiUrl()}/admin/settings/ENABLE_REFERRAL_SMS`, {
        value: newValue,
        description: 'Enable/disable Referral SMS sending (cost savings during development)'
      });
      loadSettings();
      setAlertMessage(`Referral SMS sending ${newValue === 'true' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      setAlertMessage('Failed to update setting');
    }
  };

  if (loading) return <div>Loading...</div>;

  const referralSmsSetting = settings.find(s => s.key === 'ENABLE_REFERRAL_SMS') || { value: 'true' };

  const isEnabled = referralSmsSetting.value === 'true';

  return (
    <div className="setting-card">
      <h3>Referral SMS Sending</h3>
      <p>Enable or disable Referral SMS sending via Advanta API. Disable for cost savings during development.</p>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggleReferralSMS}
          />
          <span className="toggle-slider"></span>
        </label>
        <span style={{ fontWeight: '500', color: isEnabled ? '#4ECDC4' : '#666' }}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Current status: <strong>{isEnabled ? 'SMS enabled - Referral notifications will be sent via Advanta' : 'SMS disabled - Referral notifications will not be sent'}</strong>
      </p>
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}

