import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.payments.config";

export default defineConfig({
  ...base,
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
