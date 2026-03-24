import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons.svg'],
      manifest: {
        id: '/',
        name: 'LumiBiz Gestao',
        short_name: 'LumiBiz',
        description: 'SaaS multitenant para gestao operacional e financeira',
        start_url: '/',
        scope: '/',
        theme_color: '#373737',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ]
});
