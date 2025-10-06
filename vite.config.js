import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Proxy to avoid CORS during development
    proxy: {
      // All requests starting with /v5 will be proxied to https://api.foodics.dev
      '/v5': {
        target: 'https://api.foodics.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/v5/, '/v5')
      }
    }
  }
})