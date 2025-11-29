import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

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

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5001';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Upcoming Cases' }}
      />
      <Tab.Screen 
        name="History" 
        component={CaseHistoryScreen}
        options={{ title: 'Case History' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (__DEV__) {
        // Don't check for updates in development
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      
      if (token) {
        setIsAuthenticated(true);
        setIsOnboarded(onboarded === 'true');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
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
    </PaperProvider>
  );
}
