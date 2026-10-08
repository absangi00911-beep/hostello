import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppOrigin } from "@/lib/app-url";

describe("getAppOrigin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the configured public URL origin and strips any path", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.pk/app/");
    vi.stubEnv("AUTH_URL", "https://auth.hostello.pk");

    expect(getAppOrigin()).toBe("https://hostello.pk");
  });

  it("falls back to the configured auth URL when no public URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("AUTH_URL", "https://auth.hostello.pk");

    expect(getAppOrigin()).toBe("https://auth.hostello.pk");
  });

  it("rejects an insecure configured origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://hostello.pk");
    vi.stubEnv("AUTH_URL", "");

    expect(() => getAppOrigin()).toThrow("APP_URL must use HTTPS in production.");
  });

  it("accepts a configured HTTPS origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.pk");

    expect(getAppOrigin()).toBe("https://hostello.pk");
  });
});
