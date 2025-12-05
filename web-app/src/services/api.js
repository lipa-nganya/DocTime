import axios from 'axios';

// API base URL - for web app, use localhost if backend is local
// Override with REACT_APP_API_URL environment variable for production
const DEFAULT_API_URL = 'http://localhost:5001';
const NGROK_URL = 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev'; // Fallback if needed
let apiBaseUrl = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

// Ensure apiBaseUrl doesn't already end with /api to avoid double /api/api/
if (apiBaseUrl.endsWith('/api')) {
  // Already has /api, use as is
} else if (apiBaseUrl.endsWith('/')) {
  // Ends with /, add api
  apiBaseUrl = `${apiBaseUrl}api`;
} else {
  // Doesn't end with /api or /, add /api
  apiBaseUrl = `${apiBaseUrl}/api`;
}

console.log('🔧 API Base URL:', apiBaseUrl);
console.log('🔧 Using:', apiBaseUrl.includes('localhost') ? 'Local backend' : apiBaseUrl.includes('ngrok') ? 'Ngrok (fallback)' : 'Custom URL');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  transformResponse: [(data, headers) => {
    // Don't transform blob responses
    const contentType = headers?.['content-type'] || '';
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      return data;
    }
    
    if (!data || data === '') {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }],
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
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
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      console.error('🔧 API Base URL:', apiBaseUrl);
      
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (error.message.includes('Network Error') || error.message.includes('network')) {
        error.message = `Cannot connect to server at ${apiBaseUrl}. Please check your internet connection and ensure the server is running.`;
      } else if (error.code === 'ECONNREFUSED') {
        error.message = 'Cannot connect to server. Please check if the server is running.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        error.message = 'Cannot resolve server address. Please check your internet connection.';
      }
      
      error.networkError = true;
      error.apiBaseUrl = apiBaseUrl;
    } else {
      const status = error.response?.status;
      const contentType = error.response?.headers?.['content-type'] || '';
      let responseData = error.response?.data;
      
      console.error('❌ HTTP Error:', {
        status: status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        contentType: contentType,
      });
      
      if (status === 403) {
        let dataString = '';
        try {
          if (typeof responseData === 'string') {
            dataString = responseData;
          } else if (responseData) {
            dataString = JSON.stringify(responseData);
          }
        } catch (e) {
          dataString = String(responseData || '');
        }
        
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
          error.message = error.response?.data?.error || 'Access forbidden (403). Please check your permissions.';
        }
      } else if (status === 401) {
        error.message = 'Unauthorized. Please log in again.';
      } else {
        try {
          if (error.response?.data?.error) {
            error.message = error.response.data.error;
          } else if (typeof error.response?.data === 'string') {
            error.message = error.response.data;
          }
        } catch (e) {
          error.message = `Server error (${status}). Please try again.`;
        }
      }
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - clearing auth token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isOnboarded');
    }
    
    return Promise.reject(error);
  }
);

export default api;

