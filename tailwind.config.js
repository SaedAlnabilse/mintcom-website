/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',           // Small phones (iPhone SE)
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },  // Touch devices
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' }, // Mouse/trackpad devices
      },
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
        magilio: ['Magilio', 'serif'],
      },
      fontSize: {
        // POS Typography System - Display (New)
        'display-1': ['48px', { lineHeight: '1.1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'display-2': ['36px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '-0.02em' }],
        
        // POS Typography System - Headings (Updated to match usage)
        'heading-1': ['32px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '-0.02em' }],
        'heading-2': ['28px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '-0.02em' }],
        'heading-3': ['24px', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.01em' }],
        'heading-4': ['20px', { lineHeight: '1.3', fontWeight: '800', letterSpacing: '-0.01em' }],
        'subheading': ['18px', { lineHeight: '1.4', fontWeight: '700' }],

        // POS Typography System - Body
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],

        // POS Typography System - Captions & Labels (Updated to match usage)
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.05em' }],
        'label-sm': ['11px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.05em' }],
        'label-xs': ['10px', { lineHeight: '1.4', fontWeight: '900', letterSpacing: '0.1em' }],

        // POS Typography System - Values (for cards, stats)
        'value-xl': ['40px', { lineHeight: '1.1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'value-lg': ['32px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '-0.02em' }],
        'value-md': ['26px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '-0.01em' }],
        'value': ['18px', { lineHeight: '1.3', fontWeight: '800' }],

        // POS Typography System - Buttons
        'button': ['16px', { lineHeight: '1.5', fontWeight: '700' }],
        'button-sm': ['14px', { lineHeight: '1.5', fontWeight: '700' }],

        // POS Typography System - Charts
        'chart-title': ['16px', { lineHeight: '1.4', fontWeight: '700' }],
        'legend': ['13px', { lineHeight: '1.4', fontWeight: '500' }],
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
        // Safe areas for mobile
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px',  // Minimum touch target size (Apple HIG)
        'touch-lg': '48px', // Larger touch target
      },
      minWidth: {
        'touch': '44px',  // Minimum touch target size
        'touch-lg': '48px',
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
