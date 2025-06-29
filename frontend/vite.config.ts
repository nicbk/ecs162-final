import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: mode === 'development' ? {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {
            //console.log('Proxying request:', req.url)
          })
        }
      },
    },
  } : undefined,

  test: {
    environment: 'jsdom',
  },

  resolve: process.env.VITEST
    ? {
        conditions: ['browser']
      }
    : undefined
}))
