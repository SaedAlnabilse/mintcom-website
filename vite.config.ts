import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'paymint-logo.svg', 'paymint-logo.png'],
      manifest: {
        name: 'PayMint POS',
        short_name: 'PayMint',
        description: 'All-in-One Cloud POS & Business Management',
        theme_color: '#7CC39F',
        icons: [
          {
            src: 'paymint-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'paymint-logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'paymint-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/',

  // Build optimization settings
  build: {
    rollupOptions: {
      output: {
        // Optimized chunking strategy to reduce HTTP requests
        manualChunks: (id) => {
          // React ecosystem - always needed
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }

          // Framer Motion - used widely but stable
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // Recharts - large library, lazy loaded for dashboard
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'recharts';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'forms';
          }

          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }

          // Lucide icons - bundle all icons together to reduce requests
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Socket.io - only needed for realtime features
          if (id.includes('node_modules/socket.io')) {
            return 'realtime';
          }

          // Axios and HTTP utilities
          if (id.includes('node_modules/axios')) {
            return 'http';
          }

          // Toast notifications
          if (id.includes('node_modules/react-hot-toast')) {
            return 'notifications';
          }
        },
      },
    },
    // Disable source maps for production
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Use default esbuild minification (faster than terser)
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold (inline small assets)
    assetsInlineLimit: 4096,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
  },

  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/reports': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/app-settings': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/files': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/customers': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/employees': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket proxy for real-time sync
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        rewrite: (path) => path, // Keep the path as-is
      },
      '/realtime': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      }
    }
  }
})
