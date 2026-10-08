import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));
vi.mock("next-auth/jwt", () => ({ encode: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ getIp: vi.fn(), rateLimit: vi.fn() }));

import { POST } from "./route";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { MOBILE_SESSION_MAX_AGE_SECONDS } from "@hostello/shared";
import { LOGIN_ACCOUNT_LIMIT, LOGIN_WINDOW_MS } from "@/lib/auth/login-limits";

const mobileUser = {
  id: "student_1",
  email: "student@example.com",
  name: "Student",
  password: "hashed-password",
  avatar: null,
  role: "STUDENT",
  emailVerified: null,
  tokenVersion: 2,
};

function request() {
  return new NextRequest("https://hostello.test/api/auth/mobile/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: mobileUser.email, password: "password123" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", "test-auth-secret");
  vi.stubEnv("NODE_ENV", "test");
  vi.mocked(getIp).mockReturnValue("203.0.113.10");
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: 0 });
  vi.mocked(db.user.findUnique).mockResolvedValue(mobileUser as never);
  vi.mocked(compare).mockResolvedValue(true);
  vi.mocked(encode).mockResolvedValue("signed-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/auth/mobile/login", () => {
  it("shares both independent web credential limits and returns a token", async () => {
    const res = await POST(request());
    const body = await res.json();
    const accountKey = createHmac("sha256", "test-auth-secret")
      .update(mobileUser.email.trim().toLowerCase())
      .digest("hex");

    expect(res.status).toBe(200);
    expect(rateLimit).toHaveBeenNthCalledWith(1, "login-ip:203.0.113.10", {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    expect(rateLimit.mock.calls[1][0]).toBe(`login-account:${accountKey}`);
    expect(rateLimit.mock.calls[1][1]).toEqual({
      limit: LOGIN_ACCOUNT_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    expect(rateLimit).toHaveBeenCalledTimes(2);
    expect(body.data.token).toBe("signed-token");
    expect(body.data.expiresInSeconds).toBe(MOBILE_SESSION_MAX_AGE_SECONDS);
    expect(encode).toHaveBeenCalledWith(expect.objectContaining({
      maxAge: MOBILE_SESSION_MAX_AGE_SECONDS,
    }));
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: mobileUser.email } });
  });

  it("rejects over-limit sign-ins before reading credentials or querying users", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: 1 });

    const res = await POST(request());

    expect(res.status).toBe(429);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
  });

  it("rejects distributed attempts after the shared per-account bucket is exhausted", async () => {
    vi.mocked(rateLimit)
      .mockResolvedValueOnce({ ok: true, remaining: 9, resetAt: 0 })
      .mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: 1 });

    const res = await POST(request());

    expect(res.status).toBe(429);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
    expect(encode).not.toHaveBeenCalled();
  });
});
