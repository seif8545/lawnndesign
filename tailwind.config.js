/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'serif'],
      },
      colors: {
        forest: {
          50: '#f0f7f3',
          100: '#dceee4',
          200: '#bbddcb',
          300: '#8ec4a8',
          400: '#5ea580',
          500: '#3c8762',
          600: '#2a6b4d',
          700: '#225539',
          800: '#1c4430',
          900: '#183828',
          950: '#0c2118',
        },
        sand: {
          50: '#fdf9f0',
          100: '#faf0d9',
          200: '#f5e0b3',
          300: '#edca82',
          400: '#e4ae50',
          500: '#db9630',
          600: '#c47a22',
          700: '#a3601c',
          800: '#844d1d',
          900: '#6c401a',
        },
        terra: {
          400: '#d4724a',
          500: '#c4622d',
          600: '#a84f22',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
