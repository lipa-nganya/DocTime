// Dynamic Expo configuration based on environment
// This allows separate local and development builds

module.exports = ({ config }) => {
  // Determine environment from EAS build profile or environment variable
  const buildProfile = process.env.EAS_BUILD_PROFILE || process.env.EXPO_PUBLIC_BUILD_PROFILE || 'development';
  const isLocalDev = buildProfile === 'local-dev' || process.env.EXPO_PUBLIC_ENV === 'local';
  const isCloudDev = buildProfile === 'cloud-dev' || process.env.EXPO_PUBLIC_ENV === 'cloud';
  
  // API Base URLs
  // For local dev: Use ngrok URL if available, otherwise fallback to localhost
  // Note: localhost only works in emulator, not on physical devices
  const ngrokUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.NGROK_URL || 'https://homiest-psychopharmacologic-anaya.ngrok-free.dev';
  const localApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || ngrokUrl;
  const cloudApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || ngrokUrl; // Use ngrok URL for now
  
  // Choose API URL based on environment
  // For local-dev, always use ngrok URL (localhost doesn't work on physical devices)
  const apiBaseUrl = isLocalDev ? localApiUrl : cloudApiUrl;
  
  console.log('🔧 API Configuration:', {
    buildProfile,
    isLocalDev,
    apiBaseUrl,
    envApiUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    ngrokUrl
  });
  
  // App identifiers - use different bundle IDs for local vs cloud so you can install both
  const localBundleId = 'com.doctime.app.local';
  const cloudBundleId = 'com.doctime.app';
  
  const bundleIdentifier = isLocalDev ? localBundleId : cloudBundleId;
  const packageName = isLocalDev ? 'com.doctime.app.local' : 'com.doctime.app';
  
  // App name suffix for identification
  const appNameSuffix = isLocalDev ? ' (Local)' : isCloudDev ? ' (Dev)' : '';
  
  console.log('📱 Expo Config:', {
    buildProfile,
    environment: isLocalDev ? 'LOCAL' : isCloudDev ? 'CLOUD-DEV' : 'PRODUCTION',
    apiBaseUrl,
    bundleIdentifier,
    appName: `Doc Time${appNameSuffix}`
  });

  return {
    expo: {
      name: `Doc Time${appNameSuffix}`,
      slug: 'doctime',
      version: '1.0.1',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#292F36'
      },
      updates: {
        enabled: true,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
        url: 'https://u.expo.dev/99962261-3ad5-4037-b1e7-58145d9b2e5b'
      },
      assetBundlePatterns: [
        '**/*'
      ],
      ios: {
        supportsTablet: true,
        bundleIdentifier: bundleIdentifier,
        infoPlist: {
          NSContactsUsageDescription: 'This app needs access to your contacts to refer cases to other doctors.'
          // Face ID permission removed - biometrics commented out
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#292F36'
        },
        package: packageName,
        permissions: [
          'INTERNET',
          'ACCESS_NETWORK_STATE',
          'READ_CONTACTS',
          'SEND_SMS',
          'RECEIVE_SMS'
          // Biometric permissions removed - biometrics commented out
        ]
      },
      web: {
        favicon: './assets/favicon.png',
        name: 'Doc Time',
        shortName: 'DocTime',
        lang: 'en',
        scope: '/',
        themeColor: '#4ECDC4',
        backgroundColor: '#F8F9FA',
        display: 'standalone',
        orientation: 'portrait',
        startUrl: '/',
        description: 'Doc Time - Medical case management app for doctors',
        apple: {
          appleTouchIcon: './assets/icon.png',
        },
        manifest: {
          name: `Doc Time${appNameSuffix}`,
          short_name: 'DocTime',
          description: 'Medical case management app for doctors',
          theme_color: '#4ECDC4',
          background_color: '#F8F9FA',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: './assets/icon.png',
              sizes: [96, 128, 192, 256, 384, 512],
              type: 'image/png',
            },
          ],
        },
      },
      plugins: [
        [
          'expo-notifications',
          {
            icon: './assets/icon.png',
            color: '#4ECDC4'
          }
        ],
        'expo-contacts'
      ],
      extra: {
        apiBaseUrl: apiBaseUrl,
        environment: isLocalDev ? 'local' : isCloudDev ? 'cloud-dev' : 'production',
        eas: {
          projectId: '99962261-3ad5-4037-b1e7-58145d9b2e5b'
        }
      },
      runtimeVersion: {
        policy: 'appVersion'
      }
    }
  };
};

