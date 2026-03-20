/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': '#f0f4f9',
        'light-surface': '#ffffff',
        'light-text': '#1f1f1f',
        'dark-bg': '#131314',
        'dark-surface': '#1e1f20',
        'dark-text': '#e3e3e3',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'typing': {
          '0%, 60%, 100%': { opacity: '0.5' },
          '30%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};