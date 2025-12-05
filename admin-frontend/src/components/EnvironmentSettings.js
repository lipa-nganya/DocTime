import React, { useState, useEffect } from 'react';
import {
  getEnvironmentConfig,
  saveEnvironmentConfig,
  setCurrentEnvironment,
  setLocalUrl,
  setCloudUrl,
  getApiBaseUrl
} from '../services/environment';
import './EnvironmentSettings.css';

function EnvironmentSettings() {
  const [config, setConfig] = useState(getEnvironmentConfig());
  const [localUrlInput, setLocalUrlInput] = useState(config.localUrl);
  const [cloudUrlInput, setCloudUrlInput] = useState(config.cloudUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Listen for environment changes
  useEffect(() => {
    const handleEnvironmentChange = (event) => {
      const newConfig = getEnvironmentConfig();
      setConfig(newConfig);
      setLocalUrlInput(newConfig.localUrl);
      setCloudUrlInput(newConfig.cloudUrl);
    };

    window.addEventListener('environmentChanged', handleEnvironmentChange);
    return () => {
      window.removeEventListener('environmentChanged', handleEnvironmentChange);
    };
  }, []);

  const handleEnvironmentSwitch = async (env) => {
    if (saving) return;
    
    setSaving(true);
    try {
      setCurrentEnvironment(env);
      const newConfig = getEnvironmentConfig();
      setConfig(newConfig);
      
      // Test the connection
      await testConnection(newConfig.current === 'cloud' ? newConfig.cloudUrl : newConfig.localUrl);
      
      // Reload the page to apply the new API URL everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error switching environment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocalUrl = () => {
    setLocalUrl(localUrlInput);
    const newConfig = getEnvironmentConfig();
    setConfig(newConfig);
  };

  const handleSaveCloudUrl = () => {
    setCloudUrl(cloudUrlInput);
    const newConfig = getEnvironmentConfig();
    setConfig(newConfig);
  };

  const testConnection = async (url) => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'Connection successful!',
          details: data
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestCurrent = () => {
    const currentUrl = getApiBaseUrl();
    testConnection(currentUrl);
  };

  return (
    <div className="environment-settings">
      <h3>Environment Settings</h3>
      <p className="settings-description">
        Switch between local and cloud backend environments. Changes will reload the application.
      </p>

      {/* Current Environment Display */}
      <div className="current-environment">
        <div className="environment-status">
          <span className="status-label">Current Environment:</span>
          <span className={`status-badge ${config.current === 'cloud' ? 'cloud' : 'local'}`}>
            {config.current === 'cloud' ? '☁️ Cloud' : '💻 Local'}
          </span>
        </div>
        <div className="current-url">
          <span className="url-label">API URL:</span>
          <code className="url-display">{getApiBaseUrl()}</code>
        </div>
        <button 
          className="test-button"
          onClick={handleTestCurrent}
          disabled={testing}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}
      </div>

      {/* Environment Switcher */}
      <div className="environment-switcher">
        <h4>Switch Environment</h4>
        <div className="switch-buttons">
          <button
            className={`env-button ${config.current === 'local' ? 'active' : ''}`}
            onClick={() => handleEnvironmentSwitch('local')}
            disabled={saving || config.current === 'local'}
          >
            {saving && config.current === 'local' ? 'Switching...' : 'Switch to Local'}
          </button>
          <button
            className={`env-button ${config.current === 'cloud' ? 'active' : ''}`}
            onClick={() => handleEnvironmentSwitch('cloud')}
            disabled={saving || config.current === 'cloud'}
          >
            {saving && config.current === 'cloud' ? 'Switching...' : 'Switch to Cloud'}
          </button>
        </div>
      </div>

      {/* URL Configuration */}
      <div className="url-configuration">
        <h4>Configure URLs</h4>
        
        {/* Local URL */}
        <div className="url-input-group">
          <label>
            Local Backend URL:
            <input
              type="text"
              value={localUrlInput}
              onChange={(e) => setLocalUrlInput(e.target.value)}
              placeholder="http://localhost:5001/api"
              className="url-input"
            />
          </label>
          <button
            className="save-url-button"
            onClick={handleSaveLocalUrl}
            disabled={localUrlInput === config.localUrl}
          >
            Save
          </button>
        </div>

        {/* Cloud URL */}
        <div className="url-input-group">
          <label>
            Cloud Backend URL:
            <input
              type="text"
              value={cloudUrlInput}
              onChange={(e) => setCloudUrlInput(e.target.value)}
              placeholder="https://doctime-backend-910510650031.us-central1.run.app/api"
              className="url-input"
            />
          </label>
          <button
            className="save-url-button"
            onClick={handleSaveCloudUrl}
            disabled={cloudUrlInput === config.cloudUrl}
          >
            Save
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <strong>💡 Tip:</strong> After switching environments, the page will automatically reload to apply the new API URL to all components.
      </div>
    </div>
  );
}

export default EnvironmentSettings;

