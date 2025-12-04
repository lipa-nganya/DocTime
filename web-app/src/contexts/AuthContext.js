import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking auth status...');
      const token = localStorage.getItem('authToken');
      const onboarded = localStorage.getItem('isOnboarded');
      const userData = localStorage.getItem('user');

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
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const onboarded = response.data.user.role !== null && response.data.user.preferredName;
      localStorage.setItem('isOnboarded', onboarded ? 'true' : 'false');
      
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
      
      let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
      
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      if (formattedPhone.startsWith('254')) {
        formattedPhone = formattedPhone.substring(3);
      }
      
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

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isOnboarded', 'false');

      console.log('💾 Stored auth data, updating state...');
      setIsAuthenticated(true);
      setIsOnboarded(false);
      setUser(response.data.user);

      console.log('✅ AuthContext signup complete');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext signup error:', error);
      throw error;
    }
  }, []);

  const completeOnboarding = useCallback(async (prefix, preferredName, role, otherRole) => {
    setIsLoading(true);
    try {
      console.log('📝 AuthContext.completeOnboarding called with:', { prefix, preferredName, role, otherRole });
      
      const response = await api.put('/auth/profile', {
        prefix: prefix || null,
        preferredName,
        role,
        otherRole: role === 'Other' ? otherRole : null
      });

      console.log('✅ Profile update API response:', response.data);

      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('isOnboarded', 'true');

      console.log('💾 Stored updated user data, updating state...');
      setIsOnboarded(true);
      setUser(updatedUser);

      console.log('✅ AuthContext onboarding complete');
      return { success: true };
    } catch (error) {
      console.error('❌ Onboarding error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔐 AuthContext.logout called');
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isOnboarded');
      console.log('💾 Cleared localStorage');
      
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
      console.log('✅ Auth state cleared');
      
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Logout error:', error);
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    isAuthenticated,
    isOnboarded,
    user,
    setUser,
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

