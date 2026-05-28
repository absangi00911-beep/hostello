import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
   // Exclude fixture helpers and setup files from test collection
  testIgnore: ['**/fixtures/**', '**/global.setup.ts', '**/global.teardown.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
     // Global setup — seeds the test DB once before any test runs
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // Global teardown — cleans up after all tests complete
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
  ],
});