/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './components/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'System'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'System'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'System'],
        'sans-extrabold': ['PlusJakartaSans_800ExtraBold', 'System'],
      },
      colors: {
        // Brand KaziOne (brand kit ohriginal.llc — 2026-05-23)
        'kz-orange': '#E84E26',
        'kz-orange-light': '#F06540',
        'kz-orange-dark': '#C43D1A',
        'kz-white': '#F5F5F5',
        'kz-black': '#1A0F0A',
        'kz-warm': '#FDF3F0',
        'kz-warm-border': '#F0DDD8',

        // Texte
        'kz-text': '#1A0F0A',
        'kz-text-muted': '#6B4C42',
        'kz-text-dim': '#9B7B72',

        // Sémantique
        'kz-success': '#2D7A4F',
        'kz-success-muted': '#DCFCE7',
        'kz-warning': '#D97706',
        'kz-warning-muted': '#FEF9C3',
        'kz-error': '#B91C1C',
        'kz-error-muted': '#FEE2E2',

        // Surfaces
        'kz-bg': '#FFFFFF',
        'kz-surface': '#FFFFFF',
        'kz-surface-warm': '#FDF3F0',
        'kz-elevated': '#F5F5F5',
        'kz-border': '#F0DDD8',
      },
    },
  },
  plugins: [],
};
