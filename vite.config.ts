import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || env.PROXY_TARGET || 'https://mintcompos.com';

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mintcom-leaf.svg', 'mintcom-logo.png', 'pwa-icon-192.png', 'pwa-icon-512.png'],
      manifestFilename: 'manifest.webmanifest',
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Mintcom POS',
        short_name: 'Mintcom',
        description: 'All-in-One Cloud POS & Business Management',
        theme_color: '#7dc6a2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-icon-512.png',
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
    // Never ship source maps to production (harder to reverse-engineer the bundle).
    sourcemap: false,
    rollupOptions: {
      output: {
        // Optimized chunking strategy to reduce HTTP requests
        manualChunks: (id) => {
          // Match React-prefixed packages with dedicated chunks before the
          // broad `node_modules/react` ecosystem rule below.
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'forms';
          }

          if (id.includes('node_modules/react-hot-toast')) {
            return 'notifications';
          }

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

          // Spreadsheet export/import - dynamically imported by dashboard
          // utils, kept out of page chunks so they stay cacheable
          if (id.includes('node_modules/write-excel-file') ||
              id.includes('node_modules/read-excel-file')) {
            return 'exports';
          }

          // QR rendering - only needed for QR menu / app download flows
          if (id.includes('node_modules/qrcode.react')) {
            return 'qr';
          }

          // Axios and HTTP utilities
          if (id.includes('node_modules/axios')) {
            return 'http';
          }

        },
      },
    },
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
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
        headers: {
          Origin: proxyTarget,
          Referer: `${proxyTarget}/`,
        },
      },
      '/reports': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
        rewrite: (path) => `/api${path}`,
        headers: {
          Origin: proxyTarget,
          Referer: `${proxyTarget}/`,
        },
      },
      '/app-settings': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
        rewrite: (path) => `/api${path}`,
        headers: {
          Origin: proxyTarget,
          Referer: `${proxyTarget}/`,
        },
      },
      '/files': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
      },
      '/customers': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
        rewrite: (path) => `/api${path}`,
        headers: {
          Origin: proxyTarget,
          Referer: `${proxyTarget}/`,
        },
      },
      '/employees': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
        rewrite: (path) => `/api${path}`,
        headers: {
          Origin: proxyTarget,
          Referer: `${proxyTarget}/`,
        },
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
      },
      // WebSocket proxy for real-time sync
      '/socket.io': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path,
      },
      '/realtime': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        ws: true,
      }
    }
  }
};
});
