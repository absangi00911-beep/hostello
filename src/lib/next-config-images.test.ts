import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs/config", () => ({ withSentryConfig: <T>(config: T) => config }));

async function loadConfig() {
  vi.resetModules();
  const config = (await import("../../next.config")).default;
  const rules = await config.headers!();
  const csp = rules[0].headers.find((header) => header.key === "Content-Security-Policy")!.value;
  const imgSrc = csp.split("; ").find((directive) => directive.startsWith("img-src "))!;
  const hostnames = (config.images?.remotePatterns ?? []).map((pattern) =>
    typeof pattern === "string" ? pattern : pattern.hostname,
  );
  return { imgSrc, hostnames };
}

describe("image host allowlist in next.config", () => {
  beforeEach(() => vi.unstubAllEnvs());
  afterEach(() => vi.unstubAllEnvs());

  it("allows only the configured bucket host, not all of r2.dev", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc123.r2.dev/");

    const { imgSrc, hostnames } = await loadConfig();

    expect(imgSrc).toContain("https://pub-abc123.r2.dev");
    expect(imgSrc).not.toContain("*.r2.dev");
    expect(hostnames).toContain("pub-abc123.r2.dev");
    expect(hostnames).not.toContain("pub-*.r2.dev");
  });

  it("supports a custom domain, which the old r2.dev-only CSP would have blocked", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.hostello.example");

    const { imgSrc, hostnames } = await loadConfig();

    expect(imgSrc).toContain("https://cdn.hostello.example");
    expect(hostnames).toContain("cdn.hostello.example");
  });

  it("keeps the wildcard for local development and Preview when R2_PUBLIC_URL is unset or not https", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const value of ["", "http://insecure.example", "not a url"]) {
      vi.stubEnv("R2_PUBLIC_URL", value);

      const { imgSrc, hostnames } = await loadConfig();

      expect(imgSrc).toContain("https://*.r2.dev");
      expect(hostnames).toContain("pub-*.r2.dev");
    }
  });

  it("refuses to build a production deployment without a valid https R2_PUBLIC_URL", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    for (const value of ["", "http://insecure.example", "not a url"]) {
      vi.stubEnv("R2_PUBLIC_URL", value);
      vi.resetModules();
      await expect(import("../../next.config")).rejects.toThrow(/R2_PUBLIC_URL must be set/);
    }
  });

  it("builds a production deployment that has the bucket URL", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc123.r2.dev");

    const { imgSrc } = await loadConfig();

    expect(imgSrc).not.toContain("*.r2.dev");
  });
});

describe("security-relevant next.config defaults", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("does not carry design-tool allowances or legacy routing flags", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc123.r2.dev");
    vi.resetModules();
    const config = (await import("../../next.config")).default;
    const csp = (await config.headers!())[0].headers.find((h) => h.key === "Content-Security-Policy")!.value;

    expect(csp).not.toContain("localhost:8400");
    expect(config.deprecated?.looseRouteMatching).toBeUndefined();
  });
});
