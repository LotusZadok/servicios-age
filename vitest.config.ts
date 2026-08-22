import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Un solo alias, el mismo de tsconfig.json. No hace falta un plugin para leerlo.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    // Unit tests only; Playwright specs under tests/e2e are run via `test:e2e`.
    include: ['tests/unit/**/*.test.ts'],
  },
})
