import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.ts'],
    globalSetup: ['e2e/helpers/server.ts'],
    testTimeout: 30_000,      // browser automation is slow
    hookTimeout: 60_000,      // globalSetup may take time (server start)
    pool: 'forks',            // needed for globalSetup teardown to run reliably
    sequence: {
      shuffle: false,         // tests depend on seeded DB; run in definition order
    },
  },
  resolve: {
    alias: {
      '@e2e': fileURLToPath(new URL('./e2e', import.meta.url)),
    },
  },
})
