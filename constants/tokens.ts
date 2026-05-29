export const COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceWarm: '#FDF3F0',
  elevated: '#F5F5F5',
  border: '#F0DDD8',
  orange: '#E84E26',
  orangeLight: '#F06540',
  orangeDark: '#C43D1A',
  coral: '#E84E26',
  text: '#1A0F0A',
  textSecondary: '#6B4C42',
  textMuted: '#9B7B72',
  success: '#2D7A4F',
  successMuted: '#DCFCE7',
  warning: '#D97706',
  warningMuted: '#FEF9C3',
  error: '#B91C1C',
  errorMuted: '#FEE2E2',
} as const;

export const TYPOGRAPHY = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#1A0F0A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
