import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    host: true,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: 8080,
    open: true,
  },
  css: {
    devSourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      includeAssets: ['favicon.ico', 'src/assets/icons/favicon.svg'],
      manifest: {
        name: 'Macquarie CGM Post Trade Platform',
        short_name: 'MacquariePT',
        description: 'AI-Powered SDLC Platform for regulatory compliance and automated trading systems',
        theme_color: '#FFD700',
        background_color: '#1e3c72',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'src/assets/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'src/assets/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable PWA in development to avoid issues
      },
    }),
  ],
});