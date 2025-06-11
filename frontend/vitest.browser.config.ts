// For information on how I chose to load environment variables in config https://vite.dev/config/

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {loadEnv} from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config: Edited with help of https://github.com/vitest-dev/vitest-browser-react?tab=readme-ov-file#vitest-browser-react
    plugins: [react()],

    //Server proxy for browser tests (similar to the defineConfig within vite.config.ts)
    server: {
      proxy: {
        '/api': {
          target: 'http://backend:8000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log ('Browser test proxying request:', req.url) // For debugging since no UI for headless docker testing
            })
            proxy.on('error', (err, req, res) => {
              console.log('Browser test proxy error:', err.message)
            })
          }
        }
      }
    },
    test: {
      setupFiles: ['./setup-file.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        headless: true, //For docker, makes it so no ui with browser testing
        instances: [
          { browser: 'chromium' },
        ],
      },
      coverage: {
       exclude: [
        '**/*.config.*', //Dont have to test config files
        '**/main.tsx', //Each route tested separately already
        '**/index.ts', //Simple interface file doesnt need testing
        '**/vite-env.d.ts',
        '**/helpers.ts', // Implicitly tested
        '**/client.ts', //Implicitly tested
        '**/cache_hooks.ts',
       ]
      },
      env: {
        VITE_GOOGLE_FIREBASE_API_KEY: env.VITE_GOOGLE_FIREBASE_API_KEY,
        GOOGLE_API_KEY: env.GOOGLE_API_KEY
      }
    },
  }
})

