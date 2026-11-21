import { defineConfig, devices } from "@playwright/test";
import { resolvePlaywrightTarget } from "./e2e/playwright-target-guard.mjs";

const target = resolvePlaywrightTarget();
const localBaseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  // The payment specs need their own server, fake credentials and a fake Safepay:
  // run them with `npm run e2e:payments` (playwright.payments.config.ts).
  testIgnore: "**/payments/**",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: target.baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: target.isLocal
    ? {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: localBaseURL,
        env: {
          AUTH_URL: localBaseURL,
          NEXT_PUBLIC_APP_URL: localBaseURL,
        },
        wait: { stdout: /Ready in/ },
        reuseExistingServer: false,
        stdout: "pipe",
        timeout: 120_000,
      }
    : undefined,
});
