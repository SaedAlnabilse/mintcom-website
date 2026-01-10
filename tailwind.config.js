/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#7CC39F',
          light: '#9DD4B5',
          dark: '#5FAF87',
        },
        paymint: {
          green: '#7CC39F',
          dark: '#000000', // Main background
          light: '#FFFFFF', // Main text
          gray: '#9CA3AF', // Subtitles
          surface: '#121212', // Cards/Sections
        },
        dark: {
          DEFAULT: '#000000',
          light: '#1A1A1A',
        },
        accent: {
          DEFAULT: '#D55263',
          light: '#E07584',
          dark: '#B8404F',
        },
        neutral: {
          bg: '#000000',
          white: '#FFFFFF',
        },
        // Light mode color palette - warmer tones
        cream: {
          50: '#FEFDFB',   // Very subtle cream for main bg
          100: '#FAF9F7',  // Light cream for surfaces
          200: '#F5F3F0',  // Slightly darker for cards
          300: '#EFECE7',  // Borders and dividers
          400: '#E5E1DB',  // Stronger borders
        },
        slate: {
          // Override slate for better light mode contrast
          50: '#F8FAFC',
          100: '#F1F5F9',
          150: '#EAEFF5', // Custom intermediate
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        paymint: ['Crimson Text', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}