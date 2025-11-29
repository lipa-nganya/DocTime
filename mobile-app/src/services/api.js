import axios from 'axios';
import Constants from 'expo-constants';

// Get API base URL from build config or environment
let apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

// If not in config, try environment variable
if (!apiBaseUrl) {
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
}

// Fallback to ngrok URL for local-dev
if (!apiBaseUrl || apiBaseUrl === 'http://localhost:5001' || apiBaseUrl.includes('localhost')) {
  apiBaseUrl = 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';
}

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
});

export default api;
