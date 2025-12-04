import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { Text, View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import * as Updates from 'expo-updates';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewCaseScreen from './src/screens/NewCaseScreen';
import CaseDetailsScreen from './src/screens/CaseDetailsScreen';
import CaseHistoryScreen from './src/screens/CaseHistoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ReferCaseScreen from './src/screens/ReferCaseScreen';

import { theme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user, logout } = useAuth();

  const getGreeting = () => {
    if (!user) return 'Hi';
    const prefix = user.prefix || '';
    const name = user.preferredName || '';
    if (prefix && name) {
      return `Hi ${prefix} ${name}`;
    } else if (name) {
      return `Hi ${name}`;
    } else if (prefix) {
      return `Hi ${prefix}`;
    }
    return 'Hi';
  };

  const handleLogout = async () => {
    console.log('🔘 handleLogout called');
    console.log('📊 Logout function available:', typeof logout === 'function');
    
    try {
      console.log('📋 Showing confirmation dialog...');
      const confirmed = window.confirm('Are you sure you want to logout?');
      console.log('📋 Confirmation result:', confirmed);
      
      if (confirmed) {
        console.log('✅ Logout confirmed, calling logout function...');
        if (typeof logout === 'function') {
          await logout();
          console.log('✅ Logout function completed');
        } else {
          console.error('❌ Logout is not a function!', typeof logout);
          window.alert('Logout function not available. Please refresh the page.');
        }
      } else {
        console.log('❌ Logout cancelled by user');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      window.alert('Failed to logout. Please try again.');
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitle: () => {
          const greeting = getGreeting();
          return <Text style={{ color: theme.colors.white, fontSize: 18, fontWeight: 'bold' }}>{greeting}</Text>;
        },
        headerRight: () => {
          console.log('🔧 Rendering logout button');
          return (
            <TouchableOpacity
              onPress={(e) => {
                console.log('🔘 Logout button pressed', e);
                console.log('📊 handleLogout function:', typeof handleLogout);
                e.preventDefault();
                e.stopPropagation();
                if (typeof handleLogout === 'function') {
                  handleLogout();
                } else {
                  console.error('❌ handleLogout is not a function!');
                  if (Platform.OS === 'web') {
                    window.alert('Logout handler not available');
                  }
                }
              }}
              style={{
                marginRight: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 4,
                backgroundColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
              testID="logout-button"
            >
              <Text style={{ color: theme.colors.white, fontSize: 16, fontWeight: '500' }}>
                Log Out
              </Text>
            </TouchableOpacity>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={CaseHistoryScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();

  useEffect(() => {
    checkForUpdates();
  }, []);

  // Debug logging for navigation state
  useEffect(() => {
    console.log('🧭 AppNavigator state:', { isAuthenticated, isOnboarded, isLoading });
  }, [isAuthenticated, isOnboarded, isLoading]);

  const checkForUpdates = async () => {
    try {
      if (!Updates.isEnabled) {
        return;
      }
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          await Updates.reloadAsync();
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6eb' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : !isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="NewCase" 
              component={NewCaseScreen}
              options={{ 
                headerShown: true,
                title: 'New Case',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white
              }}
            />
            <Stack.Screen 
              name="CaseDetails" 
              component={CaseDetailsScreen}
              options={{ 
                headerShown: true,
                title: 'Case Details',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white
              }}
            />
            <Stack.Screen 
              name="ReferCase" 
              component={ReferCaseScreen}
              options={{ 
                headerShown: true,
                title: 'Refer Case',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
