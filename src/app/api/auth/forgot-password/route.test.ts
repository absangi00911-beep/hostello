import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  resetTokenUpdateMany: vi.fn(),
  resetTokenCreate: vi.fn(),
  transaction: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.1"),
  sendEmail: vi.fn(),
  passwordResetEmail: vi.fn((input: { name: string; resetUrl: string }) => ({
    subject: "Reset your password",
    html: input.resetUrl,
    text: input.resetUrl,
  })),
  getAppOrigin: vi.fn(() => "https://hostello.test"),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    passwordResetToken: {
      updateMany: mocks.resetTokenUpdateMany,
      create: mocks.resetTokenCreate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
  getIp: mocks.getIp,
}));

vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/password-reset", () => ({
  passwordResetEmail: mocks.passwordResetEmail,
}));
vi.mock("@/lib/app-url", () => ({ getAppOrigin: mocks.getAppOrigin }));

import { POST } from "@/app/api/auth/forgot-password/route";

const USER = { id: "user-1", name: "A Student", email: "student@example.com" };

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("https://hostello.test/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ email: USER.email }),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue(USER);
    mocks.resetTokenUpdateMany.mockResolvedValue({ count: 0 });
    mocks.resetTokenCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations));
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 2, resetAt: Date.now() + 60_000 });
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("limits reset links per account and leaves the current token untouched at the cap", async () => {
    mocks.rateLimit
      .mockResolvedValueOnce({ ok: true, remaining: 2, resetAt: Date.now() + 60_000 })
      .mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "If that email exists, a reset link has been sent.",
    });
    expect(mocks.rateLimit).toHaveBeenNthCalledWith(2, "reset-account:user-1", {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    expect(mocks.resetTokenCreate).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("uses the configured app origin even when forwarded host headers are spoofed", async () => {
    const response = await POST(makeRequest({
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "https",
    }));

    expect(response.status).toBe(200);
    expect(mocks.passwordResetEmail).toHaveBeenCalledWith(expect.objectContaining({
      resetUrl: expect.stringMatching(/^https:\/\/hostello\.test\/reset-password\?token=/),
    }));
  });

  it("emails the raw reset token but stores only its SHA-256 digest", async () => {
    const response = await POST(makeRequest());
    const resetUrl = mocks.passwordResetEmail.mock.calls[0][0].resetUrl;
    const rawToken = new URL(resetUrl).searchParams.get("token");

    expect(response.status).toBe(200);
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.resetTokenCreate).toHaveBeenCalledWith({
      data: {
        token: createHash("sha256").update(rawToken!).digest("hex"),
        userId: USER.id,
        expiresAt: expect.any(Date),
      },
    });
    expect(mocks.resetTokenCreate.mock.calls[0][0].data.token).not.toBe(rawToken);
  });

  it("keeps the same success response for unknown accounts", async () => {
    mocks.userFindUnique.mockResolvedValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "If that email exists, a reset link has been sent.",
    });
    expect(mocks.rateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.resetTokenCreate).not.toHaveBeenCalled();
  });
});
