import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: 'localhost',
      },
      plugins: [
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
          manifest: {
            name: 'MovilNova - 维修店智能管理平台',
            short_name: 'MovilNova',
            description: '在线预约·进度追踪·配件商城 | AI 辅助诊断',
            theme_color: '#1D3557',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'favicon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
              },
              {
                src: 'favicon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
              },
              {
                src: 'favicon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable',
              },
            ],
          },
          workbox: {
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/offline\.html$/, /^\/__\//],
            globIgnores: ['**/firebase-messaging-sw.js'],
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            offlineGoogleAnalytics: false,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'unsplash-images-cache',
                  networkTimeoutSeconds: 5,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
        }),
        ...(process.env.ANALYZE === 'true' ? [visualizer({ open: true, filename: 'dist/bundle-stats.html', gzipSize: true })] : []),
      ],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-firebase-core': ['firebase/app', 'firebase/auth'],
              'vendor-firebase-firestore': ['firebase/firestore'],
              'vendor-firebase-ext': ['firebase/functions', 'firebase/storage', 'firebase/app-check'],
              'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
              'vendor-charts': ['recharts'],
              'vendor-i18n': ['i18next', 'react-i18next'],
              'vendor-sentry': ['@sentry/react'],
              'vendor-router': ['react-router-dom'],
              'vendor-icons': ['lucide-react'],
            },
          },
        },
      },
    };
});
