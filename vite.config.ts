import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the rarely-changing vendors in their own chunks. Without this a
        // one-line app change invalidates the whole precache, and every
        // installed client re-downloads the Firebase SDK on the next update.
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Ask before reloading: a silent auto-update would swap the app out
      // from under a running session.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Leagues — Your Own Journey',
        short_name: 'Leagues',
        description:
          'Track focused time as leagues walked, and watch your goals climb the tiers.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e0e11',
        theme_color: '#0e0e11',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Start a session',
            short_name: 'Start',
            url: '/?start=1',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // Firebase Hosting serves the auth handler and SDK shims under /__/;
        // those must reach the network, never the SPA shell.
        navigateFallbackDenylist: [/^\/__/],
      },
      devOptions: {
        // Lets you exercise install + offline behaviour with `npm run dev`.
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
