// e2e/fixtures/auth.ts
//
// Provides a `loggedInPage` fixture that signs a user in via the UI once,
// saves the session storage state, and reuses it across tests in the same
// worker so we don't hit the login form on every single test.
//
// Usage:
//
//   import { test, expect } from "../fixtures/auth";
//
//   test("student can view dashboard", async ({ studentPage }) => {
//     await studentPage.goto("/dashboard");
//     ...
//   });

import { test as base, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { STATE_FILE } from "../global.setup";

export interface TestState {
  owner:   { id: string; email: string; password: string };
  student: { id: string; email: string; password: string };
  hostel:  { id: string; slug: string; name: string };
}

// Read the state file written by global.setup.ts.
// Throws clearly if setup didn't run (e.g. running a single spec in isolation).
export async function loadState(): Promise<TestState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw) as TestState;
  } catch {
    throw new Error(
      "[E2E fixture] Could not read test state. " +
        "Run `npm run e2e` (not a single spec file) so global setup runs first."
    );
  }
}

// Cached storage states per role — avoids re-logging-in for every test file
// within the same Playwright worker process.
const storageStateCache: Partial<Record<"student" | "owner", string>> = {};
const STORAGE_DIR = path.join(__dirname, "..", ".auth");

async function getStorageStatePath(role: "student" | "owner"): Promise<string> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  return path.join(STORAGE_DIR, `${role}.json`);
}

/**
 * Signs the given credentials in via the /login page and returns the
 * Playwright storage state path.  Subsequent calls with the same role
 * return the cached path without re-authenticating.
 */
async function ensureLoggedIn(
  context: BrowserContext,
  page: Page,
  role: "student" | "owner",
  credentials: { email: string; password: string },
  baseURL: string,
): Promise<void> {
  if (storageStateCache[role]) return; // already authenticated in this worker

  const statePath = await getStorageStatePath(role);

  // Check if a valid saved state exists from a previous run
  const exists = await fs.access(statePath).then(() => true).catch(() => false);
  if (exists) {
    await context.addCookies(
      JSON.parse(await fs.readFile(statePath, "utf-8")).cookies ?? [],
    );
    storageStateCache[role] = statePath;
    return;
  }

  // Sign in via the UI
  await page.goto(`${baseURL}/login`);
  await page.getByLabel(/email/i).fill(credentials.email);
  await page.getByLabel(/password/i).fill(credentials.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for redirect away from /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  await context.storageState({ path: statePath });
  storageStateCache[role] = statePath;
}

// ─── Extended test fixtures ──────────────────────────────────────────────────

type AuthFixtures = {
  state: TestState;
  studentPage: Page;
  ownerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Expose the shared test state to every test
  state: async ({}, use) => {
    const state = await loadState();
    await use(state);
  },

  // A Page already signed in as the student
  studentPage: async ({ browser, baseURL }, use) => {
    const state = await loadState();
    const statePath = await getStorageStatePath("student");
    const exists = await fs.access(statePath).then(() => true).catch(() => false);

    const context = await browser.newContext(
      exists ? { storageState: statePath } : {},
    );
    const page = await context.newPage();

    if (!exists) {
      await ensureLoggedIn(context, page, "student", state.student, baseURL!);
    }

    await use(page);
    await context.close();
  },

  // A Page already signed in as the owner
  ownerPage: async ({ browser, baseURL }, use) => {
    const state = await loadState();
    const statePath = await getStorageStatePath("owner");
    const exists = await fs.access(statePath).then(() => true).catch(() => false);

    const context = await browser.newContext(
      exists ? { storageState: statePath } : {},
    );
    const page = await context.newPage();

    if (!exists) {
      await ensureLoggedIn(context, page, "owner", state.owner, baseURL!);
    }

    await use(page);
    await context.close();
  },
});

export { expect };