import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'KaziOne Booking',
  slug: 'kazione-booking-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logos/logo-square-orange.png',
  scheme: 'kazione',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/logos/logo-square-orange.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.afrotouch.kazione',
    icon: './assets/logos/logo-square-orange.png',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: 'com.afrotouch.kazione',
    icon: './assets/logos/logo-square-orange.png',
    adaptiveIcon: {
      foregroundImage: './assets/logos/logo-icon-orange.png',
      backgroundColor: '#FFFFFF',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/logos/logo-icon-orange.png',
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
