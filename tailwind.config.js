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
        // Light mode text colors (matched to POS)
        text: {
          primary: '#1F1D2B',    // Main headings, primary content
          secondary: '#737182',  // Secondary text, labels
          tertiary: '#828287',   // Tertiary text, hints
          placeholder: '#9CA3AF', // Placeholder text
          muted: '#6b7280',      // Muted/disabled text
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
        },
        // Status/Semantic colors (matched to POS)
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8',
      },
      fontFamily: {
        sans: ['Inter', 'Barlow', 'system-ui', 'sans-serif'],
        barlow: ['Barlow', 'system-ui', 'sans-serif'],
        paymint: ['Crimson Text', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // POS Typography System - Headings
        'heading-1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-2': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-3': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-4': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['18px', { lineHeight: '1.4', fontWeight: '500' }],

        // POS Typography System - Body
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],

        // POS Typography System - Captions & Labels
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '1.4', fontWeight: '500' }],
        'label-xs': ['10px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.05em' }],

        // POS Typography System - Values (for cards, stats)
        'value-xl': ['40px', { lineHeight: '1.1', fontWeight: '700' }],
        'value-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'value-md': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        'value': ['18px', { lineHeight: '1.3', fontWeight: '700' }],

        // POS Typography System - Buttons
        'button': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'button-sm': ['14px', { lineHeight: '1.5', fontWeight: '600' }],

        // POS Typography System - Charts
        'chart-title': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'legend': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.02em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      lineHeight: {
        'heading': '1.2',
        'body': '1.5',
        'caption': '1.4',
        'tight': '1.1',
        'snug': '1.3',
      },
      boxShadow: {
        'text': '0 0 1.42px rgba(143, 143, 143, 0.3)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        // POS Spacing System
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '28px',
        'huge': '32px',
      },
    },
  },
  plugins: [],
}
