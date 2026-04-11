import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /analyze, /resume, /burnout, /internship, /failure, /roadmap, /health, /auth
      // requests to the FastAPI backend during development
      '/analyze': { target: 'http://localhost:8000', changeOrigin: true },
      '/resume': { target: 'http://localhost:8000', changeOrigin: true },
      '/burnout': { target: 'http://localhost:8000', changeOrigin: true },
      '/internship': { target: 'http://localhost:8000', changeOrigin: true },
      '/failure': { target: 'http://localhost:8000', changeOrigin: true },
      '/roadmap': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
