import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(headers: Record<string, string> = {}, ip: string | null = null) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    headers: { get: (name: string) => normalizedHeaders.get(name.toLowerCase()) ?? null },
    ip,
  };
}

describe("gateway IP allowlist", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it("uses Vercel's forwarded IP and ignores spoofable alternate proxy headers", async () => {
    vi.stubEnv("GATEWAY_IPS", "jazzcash:203.0.113.10");
    const { verifyGatewayIp } = await import("@/lib/gateway-ip-allowlist");

    expect(verifyGatewayIp(makeRequest({
      "x-forwarded-for": "203.0.113.10",
      "cf-connecting-ip": "198.51.100.24",
      "x-real-ip": "198.51.100.25",
    }), "jazzcash")).toBeNull();
  });

  it("fails closed when only client-controlled proxy headers are available", async () => {
    vi.stubEnv("GATEWAY_IPS", "jazzcash:203.0.113.10");
    const { verifyGatewayIp } = await import("@/lib/gateway-ip-allowlist");

    expect(verifyGatewayIp(makeRequest({
      "cf-connecting-ip": "203.0.113.10",
      "x-real-ip": "203.0.113.10",
    }), "jazzcash")).toBe("Unable to determine client IP address");
  });

  it("fails closed on a forwarded chain without an explicit trusted-proxy policy", async () => {
    vi.stubEnv("GATEWAY_IPS", "jazzcash:203.0.113.10");
    const { verifyGatewayIp } = await import("@/lib/gateway-ip-allowlist");

    expect(verifyGatewayIp(makeRequest({
      "x-forwarded-for": "203.0.113.10, 198.51.100.24",
    }), "jazzcash")).toBe("Unable to determine client IP address");
  });

  it("parses IPv6 gateway addresses without truncating their colons", async () => {
    vi.stubEnv("GATEWAY_IPS", "jazzcash:2001:db8::10");
    const { verifyGatewayIp } = await import("@/lib/gateway-ip-allowlist");

    expect(verifyGatewayIp(makeRequest({ "x-forwarded-for": "2001:db8::10" }), "jazzcash"))
      .toBeNull();
  });
});
