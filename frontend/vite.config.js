import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',  // Allow access from other devices on the network
    proxy: {
      '/api': {
        target: 'http://10.174.133.19:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})