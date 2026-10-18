import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 80,
    allowedHosts: true,
    hmr: {
      clientPort: Number(process.env.PARKO_PORT) || 39741,
    },
    watch: {
      usePolling: true,
      interval: 800,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/logs/**'],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_TARGET || 'http://localhost:3000',
        ws: true,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'axios',
      'socket.io-client',
      'react-hot-toast',
      'date-fns',
      'chart.js',
      'react-chartjs-2',
      'qrcode.react',
      'jsbarcode',
      'xlsx',
      'html5-qrcode',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            if (
              id.includes('html5-qrcode') ||
              id.includes('jsbarcode') ||
              id.includes('qrcode.react')
            ) {
              return 'vendor-barcode';
            }
            if (
              id.includes('lucide-react') ||
              id.includes('date-fns') ||
              id.includes('axios')
            ) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

