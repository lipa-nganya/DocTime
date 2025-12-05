// Environment management service
// Handles switching between local and cloud backends

const STORAGE_KEY = 'doctime_admin_environment';
const DEFAULT_LOCAL_URL = 'http://localhost:5001/api';
const DEFAULT_CLOUD_URL = 'https://doctime-backend-910510650031.us-central1.run.app/api';

// Get environment configuration from localStorage
export const getEnvironmentConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading environment config:', error);
  }
  
  // Default configuration - use cloud in production
  const isProduction = process.env.NODE_ENV === 'production' || !window.location.hostname.includes('localhost');
  return {
    current: isProduction ? 'cloud' : 'local', // 'local' or 'cloud'
    localUrl: DEFAULT_LOCAL_URL,
    cloudUrl: DEFAULT_CLOUD_URL
  };
};

// Save environment configuration to localStorage
export const saveEnvironmentConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Trigger a custom event so components can react to the change
    window.dispatchEvent(new CustomEvent('environmentChanged', { detail: config }));
  } catch (error) {
    console.error('Error saving environment config:', error);
  }
};

// Get the current API base URL
// Ensures the URL always ends with /api
export const getApiBaseUrl = () => {
  const config = getEnvironmentConfig();
  let url = config.current === 'cloud' ? config.cloudUrl : config.localUrl;
  
  // Ensure URL ends with /api (handle both cases where it's included or not)
  if (!url.endsWith('/api')) {
    if (url.endsWith('/')) {
      url = `${url}api`;
    } else {
      url = `${url}/api`;
    }
  }
  
  return url;
};

// Set the current environment (local or cloud)
export const setCurrentEnvironment = (env) => {
  if (env !== 'local' && env !== 'cloud') {
    throw new Error('Environment must be "local" or "cloud"');
  }
  
  const config = getEnvironmentConfig();
  config.current = env;
  saveEnvironmentConfig(config);
  return config;
};

// Update local URL
export const setLocalUrl = (url) => {
  const config = getEnvironmentConfig();
  config.localUrl = url;
  saveEnvironmentConfig(config);
  return config;
};

// Update cloud URL
export const setCloudUrl = (url) => {
  const config = getEnvironmentConfig();
  config.cloudUrl = url;
  saveEnvironmentConfig(config);
  return config;
};

// Get current environment name
export const getCurrentEnvironment = () => {
  const config = getEnvironmentConfig();
  return config.current;
};

// Check if current environment is cloud
export const isCloudEnvironment = () => {
  return getCurrentEnvironment() === 'cloud';
};

// Check if current environment is local
export const isLocalEnvironment = () => {
  return getCurrentEnvironment() === 'local';
};

