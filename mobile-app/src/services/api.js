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
    'User-Agent': 'DocTime-Mobile-App', // Custom user agent
  },
  timeout: 30000, // 30 second timeout
  validateStatus: function (status) {
    // Accept status codes less than 500
    return status < 500;
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure ngrok headers are always present
    config.headers['ngrok-skip-browser-warning'] = 'true';
    config.headers['User-Agent'] = 'DocTime-Mobile-App';
    
    // Log request for debugging
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method
    });
    return response;
  },
  async (error) => {
    // Handle network errors (no response received)
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      console.error('🔧 API Base URL:', apiBaseUrl);
      console.error('🔧 Error Code:', error.code);
      console.error('🔧 Error Config:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      });
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout - server may be slow or unreachable');
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (error.message.includes('Network Error') || error.message.includes('network') || error.message.includes('Network request failed')) {
        console.error('🌐 Network connection failed - check internet connection and server status');
        // More specific error message
        error.message = `Cannot connect to server at ${apiBaseUrl}. Please check your internet connection and ensure the server is running.`;
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 Connection refused - server may be down');
        error.message = 'Cannot connect to server. Please check if the server is running.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        console.error('🔍 DNS lookup failed - check internet connection');
        error.message = 'Cannot resolve server address. Please check your internet connection.';
      }
      
      // Add more context to the error
      error.networkError = true;
      error.apiBaseUrl = apiBaseUrl;
    } else {
      // Handle HTTP errors (response received but with error status)
      console.error('❌ HTTP Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data
      });
      
      // Check if it's ngrok browser warning page (usually returns HTML)
      if (error.response.status === 403 || error.response.status === 200) {
        const contentType = error.response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.error('⚠️ ngrok browser warning page detected - may need to visit URL in browser first');
          error.message = 'Server connection issue. Please contact support.';
          error.networkError = true;
        }
      }
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

