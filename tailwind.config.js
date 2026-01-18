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
          dark: '#0F172A', // Main background (matched to POS)
          light: '#FFFFFF', // Main text
          gray: '#94A3B8', // Subtitles (matched to POS textTertiary)
          surface: '#1E293B', // Cards/Sections (matched to POS)
          tertiary: '#334155', // Tertiary background (matched to POS)
          red: '#D55263', // System Error/Delete
          text: '#F8FAFC', // Primary text in dark mode (matched to POS)
          textSecondary: '#CBD5E1', // Secondary text (matched to POS)
        },
        dark: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
        },
        accent: {
          DEFAULT: '#D55263',
          light: '#E07584',
          dark: '#B8404F',
        },
        neutral: {
          bg: '#0F172A',
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
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        paymint: ['Crimson Text', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}