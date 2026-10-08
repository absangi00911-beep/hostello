import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getTrustedClientIp } from "@/lib/client-ip";
import { getIp } from "@/lib/rate-limit";

function makeRequest(headers: Record<string, string> = {}, ip: string | null = null) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    headers: { get: (name: string) => normalizedHeaders.get(name.toLowerCase()) ?? null },
    ip,
  };
}

describe("getTrustedClientIp", () => {
  it("uses the deployment-provided forwarded address", () => {
    expect(getTrustedClientIp(makeRequest({ "x-forwarded-for": "203.0.113.10" })))
      .toBe("203.0.113.10");
  });

  it("ignores alternate proxy headers that may be client-controlled", () => {
    expect(getTrustedClientIp(makeRequest({
      "cf-connecting-ip": "203.0.113.10",
      "x-real-ip": "203.0.113.10",
    }))).toBeNull();
  });

  it("rejects ambiguous forwarded chains and falls back to direct socket IP", () => {
    expect(getTrustedClientIp(makeRequest({
      "x-forwarded-for": "203.0.113.10, 198.51.100.24",
    }))).toBeNull();
    expect(getTrustedClientIp(makeRequest({}, "203.0.113.11"))).toBe("203.0.113.11");
  });

  it("does not let alternate client headers rotate the shared rate-limit key", () => {
    const request = new NextRequest("https://hostello.pk/api/auth/signup", {
      method: "POST",
      headers: {
        "cf-connecting-ip": "203.0.113.10",
        "x-real-ip": "203.0.113.11",
      },
    });

    expect(getIp(request)).toBe("unknown");
  });
});
