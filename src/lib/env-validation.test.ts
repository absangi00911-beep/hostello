import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env-validation validates at import time unless NEXT_PHASE is set.
// Setting it makes importing the module free of side effects, so each test
// decides when validation runs.
async function load() {
  return import("./env-validation");
}

describe("validateEnvironment", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws in production when a required variable is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");

    const { validateEnvironment } = await load();

    expect(() => validateEnvironment()).toThrow(/DATABASE_URL/);
  });

  it("does not let HOSTELLO_E2E skip production validation", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("HOSTELLO_E2E", "1");

    const { validateEnvironment } = await load();

    expect(() => validateEnvironment()).toThrow(/DATABASE_URL/);
  });

  it("only warns in Vercel Preview when a production variable is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DATABASE_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { validateEnvironment } = await load();

    expect(() => validateEnvironment()).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
