import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import {
  APP_PORT,
  APP_URL,
  DISABLED_EXTERNAL_SERVICES,
  E2E_CRON_SECRET,
  FAKE_SAFEPAY,
  FAKE_SAFEPAY_URL,
} from "./e2e/payments/constants";

// The payment flow runs against its own local dev server, with fake Safepay credentials and
// every Safepay request redirected to a fake (see e2e/payments/safepay-network-stub.cjs).
// Unlike playwright.config.ts it never accepts a remote target: these credentials and this
// network redirect must not exist anywhere but a local, throwaway run.
const stub = fileURLToPath(new URL("./e2e/payments/safepay-network-stub.cjs", import.meta.url));
const inheritedNodeOptions = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : "";

export default defineConfig({
  testDir: "./e2e/payments",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  // A dev server compiles each route on first use, which can take many seconds.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: "list",
  use: { baseURL: APP_URL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${APP_PORT}`,
    url: APP_URL,
    env: {
      ...Object.fromEntries(DISABLED_EXTERNAL_SERVICES.map((name) => [name, ""])),
      AUTH_URL: APP_URL,
      NEXT_PUBLIC_APP_URL: APP_URL,
      NEXT_PUBLIC_SAFEPAY_ENV: "sandbox",
      SAFEPAY_SECRET: FAKE_SAFEPAY.secret,
      SAFEPAY_API_KEY: FAKE_SAFEPAY.apiKey,
      SAFEPAY_WEBHOOK_SECRET: FAKE_SAFEPAY.webhookSecret,
      CRON_SECRET: E2E_CRON_SECRET,
      E2E_FAKE_SAFEPAY_URL: FAKE_SAFEPAY_URL,
      NODE_OPTIONS: `${inheritedNodeOptions}--require ${stub}`,
    },
    wait: { stdout: /Ready in/ },
    reuseExistingServer: false,
    stdout: "pipe",
    timeout: 120_000,
  },
});
