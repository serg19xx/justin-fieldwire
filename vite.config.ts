import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

function hasWorkingLocalStorage(): boolean {
  return typeof globalThis.localStorage?.getItem === 'function'
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [vue()]

  if (mode === 'development' && hasWorkingLocalStorage()) {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }

  return {
  plugins,
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@fullcalendar')) return 'vendor-fullcalendar'
            if (id.includes('vue-advanced-cropper')) return 'vendor-cropper'
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
