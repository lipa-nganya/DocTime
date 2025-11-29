import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

console.log('🔧 API Base URL:', apiBaseUrl);
console.log('🔧 Config extra:', Constants.expoConfig?.extra);

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // Navigate to login (handled by App.js)
    }
    return Promise.reject(error);
  }
);

export default api;

