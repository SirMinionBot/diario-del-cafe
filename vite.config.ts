import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(() => {
  // GitHub Pages (u otro hosting con subruta) exporta DEPLOY_BASE
  const base = process.env.DEPLOY_BASE ?? '/'
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // generateSW: precache del shell + runtime caching declarativo (design D9);
        // no necesitamos service worker propio (sin Web Push en MVP)
        registerType: 'autoUpdate',
        manifest: {
          name: 'Diario del Café',
          short_name: 'CAFÉ',
          description: 'Cuaderno de barista: ratios, cronómetro y catas de tus cafés.',
          lang: 'es',
          display: 'standalone',
          scope: base,
          start_url: base,
          background_color: '#f8f3ea',
          theme_color: '#f8f3ea',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Repetir último', url: `${base}?repetir=1`, icons: [{ src: 'pwa-192.png', sizes: '192x192' }] },
            { name: 'Preparar', url: base, icons: [{ src: 'pwa-192.png', sizes: '192x192' }] },
            { name: 'Diario', url: `${base}diario`, icons: [{ src: 'pwa-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // lecturas de Supabase disponibles offline: catálogo, recetas, últimos brews
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
              method: 'GET',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-rest',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/,
              method: 'GET',
              handler: 'CacheFirst',
              options: {
                cacheName: 'brew-photos',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  }
})
