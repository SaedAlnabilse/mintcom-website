import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',

  // Build optimization settings
  build: {
    rollupOptions: {
      output: {
        // Manual chunks to optimize bundle splitting and fix circular dependency warnings
        manualChunks: {
          // Group Recharts into its own chunk to:
          // 1. Fix circular dependency warnings
          // 2. Allow it to be cached separately (it rarely changes)
          // 3. Only load when charts are actually needed
          'recharts': ['recharts'],

          // Group Framer Motion separately (used widely but stable)
          'framer-motion': ['framer-motion'],

          // Group React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Group form libraries
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Group date utilities
          'date-utils': ['date-fns'],
        },
      },
    },
    // Generate source maps for debugging (disable in production if not needed)
    sourcemap: false,
    // Increase chunk size warning limit (Recharts is large)
    chunkSizeWarningLimit: 500,
  },

  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/reports': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/app-settings': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/files': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/customers': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/employees': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/uploads': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
