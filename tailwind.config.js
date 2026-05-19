/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './components/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'kz-bg': '#0C0B0A',
        'kz-surface': '#1E1C1A',
        'kz-elevated': '#2C2926',
        'kz-border': '#3A3530',
        'kz-gold': '#C8A951',
        'kz-gold-light': '#E2CB8A',
        'kz-gold-dark': '#9A7E36',
        'kz-coral': '#E05A3A',
        'kz-text': '#F5EFDF',
        'kz-text-muted': '#A89880',
        'kz-success': '#4CAF82',
        'kz-warning': '#F0A830',
        'kz-error': '#E04848',
      },
    },
  },
  plugins: [],
};
