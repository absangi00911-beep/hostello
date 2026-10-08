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
});
