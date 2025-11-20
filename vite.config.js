import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // This ensures the app works offline by caching the basics
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Increase limit to 5MB for large chunks
      },
      manifest: {
        name: 'MealiX POS',
        short_name: 'MealiX',
        description: 'MealiX POS System',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Ensure you have these icons in /public folder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Ensure you have these icons in /public folder
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});