import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
// Prerender plugin loaded conditionally below to avoid requiring puppeteer
// in environments that don't have Chromium available (e.g. CI on small runners).
// Enable with: `npm run build:prerender`
// eslint-disable-next-line @typescript-eslint/no-require-imports
const prerender = process.env.PRERENDER === 'true'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('@prerenderer/rollup-plugin')
  : null;

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
            name: 'MovilNova - Reparación de móviles y accesorios',
            short_name: 'MovilNova',
            description: 'Reserva online · Seguimiento en tiempo real · Accesorios al mejor precio | Diagnóstico asistido por IA',
            lang: 'es-ES',
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
        // Prerender critical routes to static HTML so Googlebot, social
        // crawlers and slow connections get real content on first paint.
        // App.tsx fires window.dispatchEvent(new Event('render-event'))
        // once initial data is settled — that signals the renderer to
        // capture the DOM.
        ...(prerender ? [prerender({
          routes: [
            '/',
            '/productos',
            '/servicios',
            '/reparaciones',
            '/envio-reparacion',
            '/seguimiento',
            '/tienda/porrino',
            '/tienda/baiona',
            '/tienda/lalin',
          ],
          renderer: '@prerenderer/renderer-puppeteer',
          rendererOptions: {
            renderAfterDocumentEvent: 'render-event',
            // Allow up to 12s for Firestore subscriptions, lazy chunks, etc.
            maxConcurrentRoutes: 2,
            timeout: 12000,
            headless: 'new',
            // Inline-styles flag avoids losing Tailwind on the prerendered HTML
            inject: { isPrerender: true },
          },
          postProcess(route: { html: string }) {
            // Strip the analytics+gtag script from the prerendered HTML so we
            // don't double-fire page_view when the SPA hydrates.
            route.html = route.html.replace(
              /<script[^>]*googletagmanager\.com[^<]*<\/script>/g,
              ''
            );
            return route;
          },
        })] : []),
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
