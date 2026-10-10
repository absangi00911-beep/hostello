import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load the isolated test environment before Playwright starts the Next.js
// webServer. The global setup uses the same file for seeding its database.
loadEnv({ path: '.env.e2e', override: true });
loadEnv();

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/fixtures/**', '**/global.setup.ts', '**/global.teardown.ts'],
  globalSetup: './e2e/global.setup.ts',
  globalTeardown: './e2e/global.teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // E2E specs share the seeded users, hostel, and auth storage state.
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'npm.cmd run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      HOSTELLO_E2E: '1',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
