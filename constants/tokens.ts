export const COLORS = {
  background: '#0C0B0A',
  surface: '#1E1C1A',
  elevated: '#2C2926',
  border: '#3A3530',
  gold: '#C8A951',
  goldLight: '#E2CB8A',
  goldDark: '#9A7E36',
  coral: '#E05A3A',
  text: '#F5EFDF',
  textSecondary: '#A89880',
  textMuted: '#6B5E52',
  success: '#4CAF82',
  warning: '#F0A830',
  error: '#E04848',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
