import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { MOBILE_SESSION_MAX_AGE_SECONDS } from "@hostello/shared";

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { POST } from "./route";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const secret = "mobile-refresh-test-secret";
const salt = "authjs.session-token";
const user = {
  id: "student_1",
  name: "Student",
  email: "student@example.com",
  role: "STUDENT",
  avatar: null,
  emailVerified: null,
  tokenVersion: 2,
};

function request(token: string) {
  return new NextRequest("https://hostello.test/api/auth/mobile/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: 0 });
  vi.mocked(db.user.findUnique).mockResolvedValue(user as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/auth/mobile/refresh", () => {
  it("rejects an expired Auth.js JWE before rate-limit or database work", async () => {
    const expiredToken = await encode({
      token: { id: user.id, tokenVersion: user.tokenVersion },
      secret,
      salt,
      maxAge: -60,
    });

    const response = await POST(request(expiredToken));

    expect(response.status).toBe(401);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized bearer token before JWT decoding or database work", async () => {
    const response = await POST(request("x".repeat(4_097)));

    expect(response.status).toBe(401);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects malformed identity claims before rate-limit or database work", async () => {
    const malformedToken = await encode({
      token: { id: { unexpected: true }, tokenVersion: 2 },
      secret,
      salt,
      maxAge: 600,
    });

    const response = await POST(request(malformedToken));

    expect(response.status).toBe(401);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("refreshes a current token and returns the matching expiry lifetime", async () => {
    const currentToken = await encode({
      token: { id: user.id, tokenVersion: user.tokenVersion },
      secret,
      salt,
      maxAge: 600,
    });

    const response = await POST(request(currentToken));
    const body = await response.json();
    const refreshed = await decode({ token: body.data.token, secret, salt });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.data.expiresInSeconds).toBe(MOBILE_SESSION_MAX_AGE_SECONDS);
    expect(refreshed?.id).toBe(user.id);
    expect(refreshed?.tokenVersion).toBe(user.tokenVersion);
    expect(rateLimit).toHaveBeenCalledWith(`refresh:${user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
  });
});
