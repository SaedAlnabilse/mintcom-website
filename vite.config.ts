import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
      },
      '/app-settings': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://grateful-liberation-production-d036.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
