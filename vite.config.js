import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Ensure proper asset handling for audio files
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  build: {
    // Ensure audio files are properly copied to dist
    copyPublicDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep audio files in samples directory
          if (assetInfo.name && assetInfo.name.match(/\.(mp3|wav|ogg)$/)) {
            return 'samples/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
