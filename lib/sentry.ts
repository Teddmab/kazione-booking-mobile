import * as Sentry from '@sentry/react-native';

let initialised = false;

export function initSentry() {
  if (initialised) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__ && Boolean(dsn),
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  initialised = true;
}

export { Sentry };
