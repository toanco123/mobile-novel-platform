import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test cho phần logic thuần (không import react-native): richText, slugify, pagination...
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { globals: true, environment: 'node', include: ['src/**/*.test.ts'] },
})
