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

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      console.error('🔧 API Base URL:', apiBaseUrl);
      console.error('🔧 Error Code:', error.code);
      console.error('🔧 Error Config:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout - server may be slow or unreachable');
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (error.message.includes('Network Error') || error.message.includes('network')) {
        console.error('🌐 Network connection failed - check internet connection and server status');
        error.message = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 Connection refused - server may be down');
        error.message = 'Cannot connect to server. Please check if the server is running.';
      }
      
      // Add more context to the error
      error.networkError = true;
      error.apiBaseUrl = apiBaseUrl;
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - clearing auth token');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // Navigate to login (handled by App.js)
    }
    
    return Promise.reject(error);
  }
);

export default api;

