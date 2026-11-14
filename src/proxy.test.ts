import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env-validation", () => ({
  validateEnvironmentOnce: vi.fn(),
}));

import { proxy } from "@/proxy";

describe("proxy CSRF policy for email verification", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.test");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects cross-origin token-consumption POSTs", () => {
    const response = proxy(new NextRequest(
      "https://hostello.test/api/auth/verify-email",
      {
        method: "POST",
        headers: { origin: "https://attacker.test" },
      },
    ));

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("allows read-only token-preview GETs without an Origin header", () => {
    const response = proxy(new NextRequest(
      "https://hostello.test/api/auth/verify-email?token=preview",
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not exempt bearer-authenticated API mutations from CSRF checks", () => {
    const response = proxy(new NextRequest(
      "https://hostello.test/api/bookings",
      {
        method: "POST",
        headers: {
          authorization: "Bearer legacy-mobile-token",
          origin: "https://attacker.test",
        },
      },
    ));

    expect(response.status).toBe(403);
  });
});

describe("proxy nonce CSP (report-only)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.test");
  });
  afterEach(() => vi.unstubAllEnvs());

  const page = (headers: Record<string, string> = {}) =>
    proxy(new NextRequest("https://hostello.test/hostels/green-view", { headers }));
  const nonceOf = (policy: string | null) => policy?.match(/'nonce-([^']+)'/)?.[1];

  it("sends a nonce-based report-only policy on page responses, without unsafe-inline scripts", () => {
    const policy = page().headers.get("content-security-policy-report-only");

    expect(policy).toContain("script-src 'self' 'nonce-");
    expect(policy).toContain("'strict-dynamic'");
    expect(policy?.split("; ").find((part) => part.startsWith("script-src"))).not.toContain("unsafe-inline");
    expect(policy).toContain("report-uri /api/csp-report");
  });

  it("does not enforce it: the enforced header is not set by the proxy", () => {
    expect(page().headers.get("content-security-policy")).toBeNull();
  });

  it("uses a different nonce for every request", () => {
    const nonces = new Set([1, 2, 3, 4, 5].map(() => nonceOf(page().headers.get("content-security-policy-report-only"))));
    expect(nonces.size).toBe(5);
  });

  it("forwards the same policy to Next.js as request headers so it stamps its scripts", () => {
    const response = page();
    const forwarded = response.headers.get("x-middleware-request-content-security-policy-report-only");

    expect(forwarded).toBe(response.headers.get("content-security-policy-report-only"));
  });

  it("ignores a Content-Security-Policy request header supplied by the client", () => {
    const response = page({ "content-security-policy": "script-src 'nonce-attacker'" });
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBeNull();
    expect(response.headers.get("content-security-policy-report-only")).not.toContain("attacker");
  });

  it("adds no page policy to API responses", () => {
    const response = proxy(new NextRequest("https://hostello.test/api/hostels"));
    expect(response.headers.get("content-security-policy-report-only")).toBeNull();
  });

  it("accepts browser-sent reports, which carry no Origin header", () => {
    const response = proxy(new NextRequest("https://hostello.test/api/csp-report", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
