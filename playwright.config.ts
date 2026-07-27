import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Serial on purpose. These specs share one dev server that compiles routes on
  // demand, plus one local Supabase; running files in parallel starved it and
  // produced timeouts that looked like real failures. The suite is small enough
  // that the extra seconds are worth a trustworthy signal.
  workers: 1,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
})
