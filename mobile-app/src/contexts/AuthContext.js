import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking auth status...');
      const token = await AsyncStorage.getItem('authToken');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      const userData = await AsyncStorage.getItem('user');

      console.log('📊 Auth check results:', {
        hasToken: !!token,
        isOnboarded: onboarded === 'true',
        hasUserData: !!userData
      });

      if (token && userData) {
        setIsAuthenticated(true);
        setIsOnboarded(onboarded === 'true');
        setUser(JSON.parse(userData));
        console.log('✅ User is authenticated');
      } else {
        setIsAuthenticated(false);
        setIsOnboarded(false);
        setUser(null);
        console.log('❌ User is not authenticated');
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phoneNumber, pin) => {
    try {
      const response = await api.post('/auth/login', { phoneNumber, pin });
      
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      const onboarded = response.data.user.role !== null && response.data.user.preferredName;
      await AsyncStorage.setItem('isOnboarded', onboarded ? 'true' : 'false');
      
      setIsAuthenticated(true);
      setIsOnboarded(onboarded);
      setUser(response.data.user);
      
      return { success: true, needsOnboarding: !onboarded };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (phoneNumber, otp, pin) => {
    try {
      console.log('🔐 AuthContext.signup called with:', { phoneNumber, otpLength: otp.length, pinLength: pin.length });
      
      // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
      let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
      
      // Remove leading 0 if present
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // Remove 254 prefix if present, then add it back
      if (formattedPhone.startsWith('254')) {
        formattedPhone = formattedPhone.substring(3);
      }
      
      // Ensure we have exactly 9 digits, then add 254 prefix
      if (formattedPhone.length > 9) {
        formattedPhone = formattedPhone.substring(0, 9);
      }
      
      formattedPhone = '254' + formattedPhone;

      console.log('📤 Making signup API call...');
      const response = await api.post('/auth/signup', {
        phoneNumber: formattedPhone,
        otp,
        pin
      });

      console.log('✅ Signup API response:', response.data);

      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('isOnboarded', 'false');

      console.log('💾 Stored auth data, updating state...');
      setIsAuthenticated(true);
      setIsOnboarded(false);
      setUser(response.data.user);

      console.log('✅ AuthContext signup complete');
      console.log('📊 Auth state updated:', { 
        isAuthenticated: true, 
        isOnboarded: false, 
        user: response.data.user 
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext signup error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }, []);

  const completeOnboarding = useCallback(async (prefix, preferredName, role, otherRole) => {
    setIsLoading(true);
    try {
      console.log('📝 AuthContext.completeOnboarding called with:', { prefix, preferredName, role, otherRole });
      
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Auth token exists:', !!token);
      
      console.log('📤 Making profile update API call...');
      const response = await api.put('/auth/profile', {
        prefix: prefix || null,
        preferredName,
        role,
        otherRole: role === 'Other' ? otherRole : null
      });

      console.log('✅ Profile update API response:', response.data);

      const updatedUser = { ...user, ...response.data.user };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('isOnboarded', 'true');

      console.log('💾 Stored updated user data, updating state...');
      setIsOnboarded(true);
      setUser(updatedUser);

      console.log('✅ AuthContext onboarding complete');
      return { success: true };
    } catch (error) {
      console.error('❌ Onboarding error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔐 AuthContext.logout called');
      
      // Clear AsyncStorage first
      await AsyncStorage.multiRemove(['authToken', 'user', 'isOnboarded']);
      console.log('💾 Cleared AsyncStorage');
      
      // Update state immediately
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
      console.log('✅ Auth state cleared');
      
      // On web, force a full page reload to ensure clean state
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - forcing page reload...');
        // Use immediate reload to ensure state is cleared
        console.log('🔄 Executing immediate page reload...');
        window.location.href = '/';
      } else {
        console.log('✅ AuthContext logout complete (native)');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, try to clear state
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
      
      // On web, still try to reload
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    isAuthenticated,
    isOnboarded,
    user,
    isLoading,
    login,
    signup,
    completeOnboarding,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

