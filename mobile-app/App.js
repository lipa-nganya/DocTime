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

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';

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
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('SignUp');

  useEffect(() => {
    checkAuthStatus();
    // Delay update check to avoid interrupting user input
    const updateTimer = setTimeout(() => {
      checkForUpdates();
    }, 3000);
    
    return () => clearTimeout(updateTimer);
  }, []);

  const checkForUpdates = async () => {
    try {
      // Always check for updates, even in dev mode (for standalone builds)
      if (!Updates.isEnabled) {
        console.log('📱 Updates not enabled');
        return;
      }

      // Don't check for updates if user is on signup/login screens
      // This prevents interrupting user input
      const currentRoute = navigationRef.current?.getCurrentRoute();
      const isAuthScreen = currentRoute?.name === 'SignUp' || currentRoute?.name === 'Login';
      
      if (isAuthScreen) {
        console.log('📱 Skipping update check on auth screen');
        return;
      }

      console.log('📱 Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('📱 Update available, fetching...');
        await Updates.fetchUpdateAsync();
        // Only reload if user is not actively interacting with auth screens
        const currentRouteAfterFetch = navigationRef.current?.getCurrentRoute();
        const isStillAuthScreen = currentRouteAfterFetch?.name === 'SignUp' || currentRouteAfterFetch?.name === 'Login';
        
        if (!isStillAuthScreen) {
          console.log('📱 Update fetched, reloading...');
          await Updates.reloadAsync();
        } else {
          console.log('📱 Update fetched but delaying reload (user on auth screen)');
        }
      } else {
        console.log('📱 No updates available');
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      
      console.log('App startup check - token:', !!token, 'onboarded:', onboarded);
      
      if (token && onboarded === 'true') {
        console.log('✅ User is authenticated and onboarded, going to MainTabs');
        setInitialRoute('MainTabs');
      } else if (token && onboarded !== 'true') {
        console.log('✅ User is authenticated but not onboarded, going to Onboarding');
        setInitialRoute('Onboarding');
      } else {
        console.log('Starting at SignUp screen');
        setInitialRoute('SignUp');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('SignUp');
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
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
