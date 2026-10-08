import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ getIp: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@/lib/operational-logger", () => ({
  createOperationalLogContext: vi.fn(() => ({ request_id: "req_test" })),
  hashOperationalIdentifier: vi.fn(() => "opaque-hash"),
  logOperationalEvent: vi.fn(),
}));

import { authorizeCredentials } from "./credentials-authorize";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { logOperationalEvent } from "@/lib/operational-logger";

const request = new Request("https://hostello.test/api/auth/callback/credentials", {
  method: "POST",
});

const user = {
  id: "student_1",
  email: "Student@example.com",
  name: "Student",
  password: "hashed-password",
  avatar: null,
  role: "STUDENT",
  emailVerified: null,
  tokenVersion: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", "test-auth-secret");
  vi.mocked(getIp).mockReturnValue("203.0.113.10");
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: 0 });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authorizeCredentials", () => {
  it("rejects malformed credentials before rate-limit or database work", async () => {
    await expect(authorizeCredentials({ email: "not-an-email", password: "short" }, request))
      .resolves.toBeNull();

    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("limits attempts by trusted client IP before account or database work", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: 1 });

    await expect(authorizeCredentials({ email: user.email, password: "password123" }, request))
      .rejects.toThrow("Too many login attempts");

    expect(getIp).toHaveBeenCalledWith(request);
    expect(rateLimit).toHaveBeenCalledWith("login-ip:203.0.113.10", {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(logOperationalEvent).toHaveBeenCalledWith(
      "warn",
      "auth.login.throttled",
      expect.objectContaining({ limit_scope: "ip", principal_hash: "opaque-hash", ip_hash: "opaque-hash" }),
      { request_id: "req_test" },
    );
  });

  it("keys the account limit with an HMAC instead of storing the email in the limiter key", async () => {
    const accountKey = createHmac("sha256", "test-auth-secret")
      .update(user.email.trim().toLowerCase())
      .digest("hex");

    await authorizeCredentials({ email: user.email, password: "password123" }, request);

    expect(rateLimit).toHaveBeenNthCalledWith(1, "login-ip:203.0.113.10", {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    expect(rateLimit).toHaveBeenNthCalledWith(2, `login-account:${accountKey}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    expect(JSON.stringify(vi.mocked(rateLimit).mock.calls)).not.toContain(user.email);
  });

  it("returns the authenticated user only after both limits and password verification pass", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never);
    vi.mocked(compare).mockResolvedValue(true);

    await expect(authorizeCredentials({ email: user.email, password: "password123" }, request))
      .resolves.toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        tokenVersion: user.tokenVersion,
      });

    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: user.email } });
    expect(compare).toHaveBeenCalledWith("password123", user.password);
    expect(logOperationalEvent).toHaveBeenCalledWith(
      "info",
      "auth.login.succeeded",
      expect.objectContaining({ role: user.role, principal_hash: "opaque-hash", ip_hash: "opaque-hash" }),
      { request_id: "req_test" },
    );
  });

  it("logs incorrect credentials with a generic reason and no raw email", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never);
    vi.mocked(compare).mockResolvedValue(false);

    await expect(authorizeCredentials({ email: user.email, password: "wrong-password" }, request))
      .resolves.toBeNull();

    expect(logOperationalEvent).toHaveBeenCalledWith(
      "warn",
      "auth.login.rejected",
      expect.objectContaining({ reason: "invalid_credentials", principal_hash: "opaque-hash", ip_hash: "opaque-hash" }),
      { request_id: "req_test" },
    );
    expect(JSON.stringify(vi.mocked(logOperationalEvent).mock.calls)).not.toContain(user.email);
  });

  it("does not query the account when its attempt limit is exhausted", async () => {
    vi.mocked(rateLimit)
      .mockResolvedValueOnce({ ok: true, remaining: 9, resetAt: 0 })
      .mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: 1 });

    await expect(authorizeCredentials({ email: user.email, password: "password123" }, request))
      .rejects.toThrow("Too many login attempts");

    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
