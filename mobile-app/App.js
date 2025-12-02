import React, { useEffect, useState } from 'react';
import { NavigationContainer, useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useCallback } from 'react';
import { Alert, Text } from 'react-native';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewCaseScreen from './src/screens/NewCaseScreen';
import CaseDetailsScreen from './src/screens/CaseDetailsScreen';
import CaseHistoryScreen from './src/screens/CaseHistoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ReferCaseScreen from './src/screens/ReferCaseScreen';
import api from './src/services/api';

import { theme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5001';

function MainTabs() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all auth-related data
              await AsyncStorage.multiRemove(['authToken', 'user', 'isOnboarded']);
              setUser(null);
              
              // Reset navigation to SignUp screen
              // Get the root navigator (the Stack navigator)
              const rootNavigation = navigation.getParent() || navigation;
              rootNavigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'SignUp' }],
                })
              );
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  }, [navigation]);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      // Always try to fetch latest from API to ensure we have prefix/preferredName
      try {
        const response = await api.get('/auth/profile');
        if (response.data.user) {
          setUser(response.data.user);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If profile fetch fails, check if user is logged out
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          // User is logged out, navigate to SignUp
          const rootNavigation = navigation.getParent() || navigation;
          rootNavigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'SignUp' }],
            })
          );
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, [navigation]);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Refresh user data when tabs come into focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

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
        headerRight: () => (
          <IconButton
            icon="logout"
            iconColor={theme.colors.white}
            size={24}
            onPress={handleLogout}
            style={{ marginRight: 8 }}
          />
        ),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Tab.Screen 
        name="History" 
        component={CaseHistoryScreen}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = React.useRef(null);

  useEffect(() => {
    checkAuth();
    checkForUpdates();
  }, []);

  // Listen for navigation state changes to check auth
  useEffect(() => {
    const unsubscribe = navigationRef.current?.addListener('state', () => {
      checkAuth();
    });
    return unsubscribe;
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
      <NavigationContainer ref={navigationRef}>
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
