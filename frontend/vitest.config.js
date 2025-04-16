// frontend/vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // <-- This simulates a browser environment
    globals: true,
    css: true,
  },
})
