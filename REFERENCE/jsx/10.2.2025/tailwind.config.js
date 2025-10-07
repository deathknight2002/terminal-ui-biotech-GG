/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        aurora: {
          50: '#F5F9FF',
          100: '#E6F0FF',
          200: '#C4DBFF',
          300: '#9FC4FF',
          400: '#6EA4FF',
          500: '#3A7BFF',
          600: '#285FD6',
          700: '#1D47A6',
          800: '#173A85',
          900: '#112756'
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'aurora-shift': 'aurora 18s linear infinite',
        'gradient-x': 'gradient-x 15s ease infinite'
      },
      keyframes: {
        aurora: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' }
        },
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        }
      }
    }
  },
  plugins: []
};
