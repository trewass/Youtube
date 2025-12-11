import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/',
  build: {
    // Оптимизация для production
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Оставляем console.log для отладки
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем на чанки для лучшего кеширования
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  // Настройка для PWA
  publicDir: 'public',
})

