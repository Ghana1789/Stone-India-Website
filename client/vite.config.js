import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Don't crash Vite dev server if backend is temporarily down (e.g. nodemon restart)
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite proxy] Backend temporarily unavailable:', err.code);
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite proxy] Socket.io backend temporarily unavailable:', err.code);
          });
        }
      }
    }
  }
})
