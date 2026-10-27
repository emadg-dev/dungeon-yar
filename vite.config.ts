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
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
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
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
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
