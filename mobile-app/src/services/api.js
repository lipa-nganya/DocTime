import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// FORCE ngrok URL - always use ngrok for API calls
// This ensures OTA updates work correctly regardless of build config
const NGROK_URL = 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';

// Get API base URL from build config or environment (for reference only)
let configApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;
if (!configApiUrl) {
  configApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
}

// ALWAYS use ngrok URL - override any build config
// This is necessary because OTA updates can't change Constants.expoConfig values
let apiBaseUrl = NGROK_URL;

// Log what we're using vs what was in config (for debugging)
if (configApiUrl && configApiUrl !== NGROK_URL) {
  console.log('⚠️ Overriding build config API URL:', configApiUrl, '→', NGROK_URL);
}

console.log('🔧 API Base URL:', apiBaseUrl);
console.log('🔧 Config extra:', Constants.expoConfig?.extra);

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
  timeout: 30000, // 30 second timeout
  validateStatus: function (status) {
    // Only accept 2xx status codes as success
    return status >= 200 && status < 300;
  },
  // Don't transform response data automatically - handle it manually
  transformResponse: [(data) => {
    // If data is empty or undefined, return null
    if (!data || data === '') {
      return null;
    }
    // Try to parse JSON, but handle errors gracefully
    try {
      return JSON.parse(data);
    } catch (e) {
      // If it's not JSON (e.g., HTML from ngrok), return the raw data
      return data;
    }
  }],
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
    // Don't set User-Agent on web (browser blocks it)
    if (typeof navigator === 'undefined' || !navigator.userAgent.includes('Mozilla')) {
      config.headers['User-Agent'] = 'DocTime-Mobile-App';
    }
    
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
      const status = error.response?.status;
      const contentType = error.response?.headers?.['content-type'] || '';
      let responseData = error.response?.data;
      
      console.error('❌ HTTP Error:', {
        status: status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        contentType: contentType,
        hasData: !!responseData
      });
      
      // Handle 403 errors (likely ngrok browser warning)
      if (status === 403) {
        // Try to get response data as string if it exists
        let dataString = '';
        try {
          if (typeof responseData === 'string') {
            dataString = responseData;
          } else if (responseData) {
            dataString = JSON.stringify(responseData);
          }
        } catch (e) {
          // If parsing fails, it's likely HTML
          dataString = String(responseData || '');
        }
        
        // Check if it's HTML (ngrok warning page)
        if (contentType.includes('text/html') || 
            dataString.includes('ngrok') || 
            dataString.includes('browser warning') ||
            dataString.includes('<!DOCTYPE') ||
            dataString.includes('<html')) {
          console.error('⚠️ ngrok browser warning page detected (403)');
          error.message = `Cannot connect to server (403). This is likely due to ngrok's browser warning.\n\nPlease:\n1. Open ${apiBaseUrl} in a new browser tab\n2. Click "Visit Site" to bypass the warning\n3. Come back here and try again`;
          error.networkError = true;
          error.ngrokWarning = true;
        } else {
          // Regular 403 error
          error.message = error.response?.data?.error || 'Access forbidden (403). Please check your permissions.';
        }
      } else if (status === 401) {
        // Handle auth errors separately
        error.message = 'Unauthorized. Please log in again.';
      } else {
        // Other HTTP errors
        try {
          if (error.response?.data?.error) {
            error.message = error.response.data.error;
          } else if (typeof error.response?.data === 'string') {
            error.message = error.response.data;
          }
        } catch (e) {
          // If we can't parse the error, use a generic message
          error.message = `Server error (${status}). Please try again.`;
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

