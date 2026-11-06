import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? localBaseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100",
        env: {
          AUTH_URL: localBaseURL,
          NEXT_PUBLIC_APP_URL: localBaseURL,
        },
        wait: { stdout: /Ready in/ },
        reuseExistingServer: false,
        stdout: "pipe",
        timeout: 120_000,
      },
});
