import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite configuration for the pose capture PWA
// See docs/spec for details on runtime caching and manifest options.
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/*'],
        manifest: {
          name: 'Pose Capture PWA',
          short_name: 'PoseCapture',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#ffffff',
          theme_color: '#0d9488',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              // Cache MediaPipe assets from jsDelivr; these rarely change
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'mediapipe-assets',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              // Cache WASM and .task files, which may come from public/tasks-vision as well
              urlPattern: /\.wasm$|\.task$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'mediapipe-wasm',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      outDir: 'dist',
      target: 'esnext'
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  };
});