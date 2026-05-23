import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'KaziOne Booking',
  slug: 'kazione-booking-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'kazione',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0C0B0A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.afrotouch.kazione',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: 'com.afrotouch.kazione',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0C0B0A',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ['@stripe/stripe-react-native', {}],
    '@sentry/react-native',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '68b7dcc4-7c49-4726-b0a4-00d820b24980',
    },
  },
};

export default config;
