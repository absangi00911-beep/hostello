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

  describe("production configuration", () => {
    // Every variable the validator requires in production, set to a harmless value.
    async function setAllRequired() {
      const { ENV_VALIDATION_RULES } = await load();
      for (const rule of ENV_VALIDATION_RULES) {
        if (rule.requiredInProduction) vi.stubEnv(rule.name, "configured");
      }
      vi.stubEnv("RESEND_API_KEY", "re_live_key_123");
      vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "production");
      vi.stubEnv("PAYOUT_DESTINATION_ENCRYPTION_KEY", "configured");
      vi.stubEnv("TWILIO_ACCOUNT_SID", "configured");
      vi.stubEnv("TWILIO_AUTH_TOKEN", "configured");
      vi.stubEnv("TWILIO_PHONE_NUMBER", "configured");
      vi.stubEnv("VERCEL_ENV", "production");
    }

    it("passes with a complete, valid configuration and no warnings", async () => {
      await setAllRequired();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { validateEnvironment } = await load();

      expect(() => validateEnvironment()).not.toThrow();
      expect(warn).not.toHaveBeenCalled();
    });

    it("requires an explicit Safepay environment instead of defaulting to the sandbox", async () => {
      await setAllRequired();
      vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "");

      const { validateEnvironment } = await load();

      expect(() => validateEnvironment()).toThrow(/NEXT_PUBLIC_SAFEPAY_ENV/);
    });

    it("allows an explicit sandbox but says so", async () => {
      await setAllRequired();
      vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { validateEnvironment } = await load();

      expect(() => validateEnvironment()).not.toThrow();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("sandbox"));
    });

    it("rejects a placeholder or malformed Resend key", async () => {
      await setAllRequired();
      const { validateEnvironment } = await load();

      vi.stubEnv("RESEND_API_KEY", "re_placeholder");
      expect(() => validateEnvironment()).toThrow(/RESEND_API_KEY/);

      vi.stubEnv("RESEND_API_KEY", "not-a-resend-key");
      expect(() => validateEnvironment()).toThrow(/RESEND_API_KEY/);
    });

    it("warns, without failing, when payout or SMS settings are missing", async () => {
      await setAllRequired();
      vi.stubEnv("PAYOUT_DESTINATION_ENCRYPTION_KEY", "");
      vi.stubEnv("TWILIO_AUTH_TOKEN", "");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { validateEnvironment } = await load();

      expect(() => validateEnvironment()).not.toThrow();
      const message = String(warn.mock.calls[0]?.[0]);
      expect(message).toContain("PAYOUT_DESTINATION_ENCRYPTION_KEY");
      expect(message).toContain("TWILIO_AUTH_TOKEN");
    });

    it("does not apply the production-only checks in Vercel Preview", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "");
      vi.stubEnv("RESEND_API_KEY", "re_placeholder");
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const { validateEnvironment } = await load();

      expect(() => validateEnvironment()).not.toThrow();
    });
  });
});
