import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import NewCaseScreen from './screens/NewCaseScreen';
import CaseDetailsScreen from './screens/CaseDetailsScreen';
import CaseHistoryScreen from './screens/CaseHistoryScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReferCaseScreen from './screens/ReferCaseScreen';
import MainTabs from './components/MainTabs';
import './App.css';

function AppNavigator() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f6eb' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Protected routes
  if (isAuthenticated && !isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isAuthenticated && isOnboarded && 
      (location.pathname === '/welcome' || location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated && location.pathname !== '/welcome' && 
      location.pathname !== '/login' && location.pathname !== '/signup') {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </>
      ) : !isOnboarded ? (
        <>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MainTabs />}>
            <Route index element={<HomeScreen />} />
            <Route path="history" element={<CaseHistoryScreen />} />
            <Route path="reports" element={<ReportsScreen />} />
          </Route>
          <Route path="/new-case" element={<NewCaseScreen />} />
          <Route path="/case/:id" element={<CaseDetailsScreen />} />
          <Route path="/refer/:id" element={<ReferCaseScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppNavigator />
      </Router>
    </AuthProvider>
  );
}

