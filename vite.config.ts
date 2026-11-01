import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME_FA, APP_SHORT_NAME, APP_TAGLINE, pageTitle } from './src/config/app.ts';

function htmlBrandPlugin(): Plugin {
  return {
    name: 'html-brand-plugin',
    transformIndexHtml(html) {
      return html
        .replace(/<title>.*?<\/title>/i, `<title>${pageTitle()}</title>`)
        .replace(/%APP_TITLE%/g, pageTitle())
        .replace(/%APP_DESCRIPTION%/g, APP_TAGLINE)
        .replace(/%APP_NAME_FA%/g, APP_NAME_FA)
        .replace(/%APP_SHORT_NAME%/g, APP_SHORT_NAME)
        .replace(
          /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i,
          `<meta name="description" content="${APP_TAGLINE}"`
        )
        .replace(
          /<meta\s+name=["']apple-mobile-web-app-title["']\s+content=["'][^"']*["']/i,
          `<meta name="apple-mobile-web-app-title" content="${APP_SHORT_NAME}"`
        )
        .replace(
          /<meta\s+name=["']application-name["']\s+content=["'][^"']*["']/i,
          `<meta name="application-name" content="${APP_SHORT_NAME}"`
        )
        .replace(
          /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/i,
          `<meta property="og:title" content="${pageTitle()}"`
        )
        .replace(
          /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/i,
          `<meta property="og:description" content="${APP_TAGLINE}"`
        );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      htmlBrandPlugin(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: APP_NAME_FA,
          short_name: APP_SHORT_NAME,
          description: APP_TAGLINE,
          theme_color: '#0E0D0C',
          background_color: '#0E0D0C',
          display: 'standalone',
          dir: 'rtl',
          lang: 'fa',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              // Self-hosted and external Vazirmatn font woff2
              urlPattern: /.*\/fonts\/.*\.(?:woff2?|ttf|eot)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'vazirmatn-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Stale-While-Revalidate for non-auth GET data requests
              urlPattern: ({ url, request }) => {
                if (request.method !== 'GET') return false;
                const path = url.pathname;
                const isAuth = path.startsWith('/api/auth') || path.startsWith('/api/me');
                return path.startsWith('/api/') && !isAuth;
              },
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-data-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
