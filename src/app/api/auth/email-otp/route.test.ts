import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verificationTokenDeleteMany: vi.fn(),
  verificationTokenCreate: vi.fn(),
  userFindUnique: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.21"),
  sendEmail: vi.fn(),
  emailOtp: vi.fn((input: { code: string }) => ({
    subject: "Your HostelLo login code",
    html: input.code,
  })),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      deleteMany: mocks.verificationTokenDeleteMany,
      create: mocks.verificationTokenCreate,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  getIp: mocks.getIp,
  rateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/login-otp", () => ({ loginOtpEmail: mocks.emailOtp }));

import { POST as requestOtp } from "@/app/api/auth/email-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/email-otp/verify/route";
import { hashEmailOtp } from "@/lib/auth/email-otp";
import { rateLimit } from "@/lib/rate-limit";

function makeRequest(
  url: string,
  body: unknown,
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("email OTP routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_SECRET", "test-auth-secret");
    vi.mocked(rateLimit).mockResolvedValue({
      ok: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 0 });
    mocks.verificationTokenCreate.mockResolvedValue({});
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.sendEmail.mockResolvedValue({ success: true });
    mocks.transaction.mockImplementation(
      async (callback: (tx: {
        verificationToken: {
          deleteMany: typeof mocks.verificationTokenDeleteMany;
          create: typeof mocks.verificationTokenCreate;
        };
        user: { findUnique: typeof mocks.userFindUnique };
      }) => unknown) =>
        callback({
          verificationToken: {
            deleteMany: mocks.verificationTokenDeleteMany,
            create: mocks.verificationTokenCreate,
          },
          user: { findUnique: mocks.userFindUnique },
        }),
    );
  });

  it("sends a 10-minute code and stores only an HMAC digest", async () => {
    const response = await requestOtp(
      makeRequest("https://hostello.test/api/auth/email-otp", {
        email: "  Student@Example.com ",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "If this email can receive sign-in codes, a code has been sent.",
    });
    expect(mocks.emailOtp).toHaveBeenCalledWith({
      code: expect.stringMatching(/^\d{6}$/),
    });

    const code = mocks.emailOtp.mock.calls[0][0].code;
    expect(mocks.verificationTokenCreate).toHaveBeenCalledWith({
      data: {
        identifier: "email-otp:student@example.com",
        token: hashEmailOtp("student@example.com", code),
        expires: expect.any(Date),
      },
    });
    expect(mocks.verificationTokenCreate.mock.calls[0][0].data.token)
      .not.toBe(code);
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: "Serializable" },
    );
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      expect.not.stringContaining("student@example.com"),
      expect.any(Object),
    );
  });

  it("does not claim to send a code when the email provider is unavailable", async () => {
    mocks.sendEmail.mockResolvedValue({ success: false, error: "provider down" });

    const response = await requestOtp(
      makeRequest("https://hostello.test/api/auth/email-otp", {
        email: "student@example.com",
      }),
    );

    expect(response.status).toBe(503);
    expect(mocks.verificationTokenDeleteMany).toHaveBeenCalledWith({
      where: {
        identifier: "email-otp:student@example.com",
        token: hashEmailOtp(
          "student@example.com",
          mocks.emailOtp.mock.calls[0][0].code,
        ),
      },
    });
    expect(await response.json()).toEqual({
      error: "Email delivery is temporarily unavailable. Please try again.",
    });
  });

  it("rejects malformed email input before creating a token", async () => {
    const response = await requestOtp(
      makeRequest("https://hostello.test/api/auth/email-otp", {
        email: "not-an-email",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verificationTokenCreate).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("atomically consumes a valid OTP and issues a hashed short-lived grant for a new account", async () => {
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 1 });
    mocks.verificationTokenCreate.mockResolvedValue({});

    const response = await verifyOtp(
      makeRequest("https://hostello.test/api/auth/email-otp/verify", {
        email: "student@example.com",
        code: "123456",
      }),
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({ needsName: true });
    expect(result.grant).toMatch(/^[a-f0-9]{64}$/);

    expect(mocks.verificationTokenDeleteMany).toHaveBeenCalledWith({
      where: {
        identifier: "email-otp:student@example.com",
        token: createHmac("sha256", "test-auth-secret")
          .update("email-otp:student@example.com:123456")
          .digest("hex"),
        expires: { gt: expect.any(Date) },
      },
    });
    expect(mocks.verificationTokenCreate).toHaveBeenCalledWith({
      data: {
        identifier: "email-login-grant:student@example.com",
        token: createHash("sha256").update(result.grant).digest("hex"),
        expires: expect.any(Date),
      },
    });
  });

  it("does not issue a grant when the OTP is invalid or expired", async () => {
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 0 });

    const response = await verifyOtp(
      makeRequest("https://hostello.test/api/auth/email-otp/verify", {
        email: "student@example.com",
        code: "000000",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verificationTokenCreate).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: "That code is invalid or has expired. Request a new one.",
    });
  });

  it("requires a name only after the email code is proven for an unregistered address", async () => {
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 1 });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1" });

    const response = await verifyOtp(
      makeRequest("https://hostello.test/api/auth/email-otp/verify", {
        email: "student@example.com",
        code: "123456",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      needsName: false,
      grant: expect.any(String),
    });
  });
});
