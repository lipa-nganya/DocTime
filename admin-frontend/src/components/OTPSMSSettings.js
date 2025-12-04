import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertModal from './AlertModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function OTPSMSSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings`);
      setSettings(response.data.settings || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSMS = async () => {
    const smsSetting = settings.find(s => s.key === 'ENABLE_SMS');
    const newValue = smsSetting?.value === 'true' ? 'false' : 'true';
    
    try {
      await axios.put(`${API_BASE_URL}/admin/settings/ENABLE_SMS`, {
        value: newValue,
        description: 'Enable/disable OTP SMS sending (cost savings during development)'
      });
      loadSettings();
      setAlertMessage(`SMS sending ${newValue === 'true' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      setAlertMessage('Failed to update setting');
    }
  };

  if (loading) return <div>Loading...</div>;

  const smsSetting = settings.find(s => s.key === 'ENABLE_SMS') || { value: process.env.ENABLE_SMS || 'false' };

  const isEnabled = smsSetting.value === 'true';

  return (
    <div className="setting-card">
      <h3>OTP SMS Sending</h3>
      <p>Enable or disable OTP SMS sending via Advanta API. Disable for cost savings during development.</p>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggleSMS}
          />
          <span className="toggle-slider"></span>
        </label>
        <span style={{ fontWeight: '500', color: isEnabled ? '#4ECDC4' : '#666' }}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Current status: <strong>{isEnabled ? 'SMS enabled - OTPs will be sent via Advanta' : 'SMS disabled - OTPs shown in dev mode only'}</strong>
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

