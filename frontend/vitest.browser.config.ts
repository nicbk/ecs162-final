import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Edited with help of https://github.com/vitest-dev/vitest-browser-react?tab=readme-ov-file#vitest-browser-react
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./setup-file.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
})
