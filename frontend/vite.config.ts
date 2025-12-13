import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Dev mode configuration
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // Workbox options
      injectManifest: {
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,webp}'
        ],
        // Исключаем большие файлы и специфичные директории
        globIgnores: [
          '**/node_modules/**/*',
          '**/sw.js',
          '**/workbox-*.js'
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },

      // PWA Manifest
      manifest: {
        name: 'AudioBook Library - Библиотека Аудиокниг',
        short_name: 'AudioBooks',
        description: 'Офлайн библиотека аудиокниг с заметками и AI обсуждениями',
        theme_color: '#1f2937',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['music', 'books', 'education'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
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

