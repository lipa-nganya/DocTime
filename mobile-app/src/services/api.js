import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const getBaseURL = () => {
  const buildProfile = Constants.expoConfig?.extra?.environment || process.env.EXPO_PUBLIC_ENV || process.env.EXPO_PUBLIC_BUILD_PROFILE;
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package;
  const isLocalDevBuild = bundleId?.includes('.local') || bundleId?.includes('localdev');
  
  const envBase = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  const configBase = normalizeBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl);
  
  console.log('🔍 [API] Environment Detection:', {
    buildProfile,
    bundleId,
    isLocalDevBuild,
    envBase,
    configBase,
  });
  
  // Priority 1: Environment variable
  if (envBase) {
    console.log('🌐 [API] Using URL from EXPO_PUBLIC_API_BASE_URL:', `${envBase}/api`);
    return `${envBase}/api`;
  }
  
  // Priority 2: Config extra
  if (configBase) {
    console.log('🌐 [API] Using URL from app config:', `${configBase}/api`);
    return `${configBase}/api`;
  }
  
  // Priority 3: Local dev fallback
  if (buildProfile === 'local-dev' || isLocalDevBuild) {
    const ngrokUrl = 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';
    console.log('🌐 [API] Local-dev mode - using ngrok:', `${ngrokUrl}/api`);
    return `${ngrokUrl}/api`;
  }
  
  // Fallback for emulator
  if (__DEV__ && Platform.OS === 'android') {
    console.warn('⚠️ [API] Using emulator fallback (10.0.2.2)');
    return 'http://10.0.2.2:5001/api';
  }
  
  // Final fallback
  const ngrokUrl = 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';
  console.warn('⚠️ [API] Using fallback ngrok URL:', `${ngrokUrl}/api`);
  return `${ngrokUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor - add token if available
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

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error - No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
