import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  verificationTokenDeleteMany: vi.fn(),
  verificationTokenCreate: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.21"),
  sendEmail: vi.fn(),
  verificationEmail: vi.fn((input: { name: string; verifyUrl: string }) => ({
    subject: "Verify email",
    html: input.verifyUrl,
    text: input.verifyUrl,
  })),
  getAppOrigin: vi.fn(() => "https://hostello.test"),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    verificationToken: {
      deleteMany: mocks.verificationTokenDeleteMany,
      create: mocks.verificationTokenCreate,
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: mocks.getIp }));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/verification", () => ({ verificationEmail: mocks.verificationEmail }));
vi.mock("@/lib/app-url", () => ({ getAppOrigin: mocks.getAppOrigin }));

import { POST } from "@/app/api/auth/resend-verification/route";
import { rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";

const USER = { id: "user-1", name: "A Student", email: "student@example.com", emailVerified: null };

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 2, resetAt: Date.now() + 60_000 });
    mocks.auth.mockResolvedValue({ user: { id: USER.id } });
    mocks.userFindUnique.mockResolvedValue(USER);
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 1 });
    mocks.verificationTokenCreate.mockResolvedValue({});
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("emails the raw verification token but stores only its SHA-256 digest", async () => {
    const response = await POST(new NextRequest("https://hostello.test/api/auth/resend-verification", {
      method: "POST",
    }));

    expect(response.status).toBe(200);
    const verificationUrl = mocks.verificationEmail.mock.calls[0][0].verifyUrl;
    const rawToken = new URL(verificationUrl).searchParams.get("token");
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.verificationTokenCreate).toHaveBeenCalledWith({
      data: {
        token: hashOneTimeToken(rawToken!),
        identifier: USER.email,
        expires: expect.any(Date),
      },
    });
    expect(mocks.verificationTokenCreate.mock.calls[0][0].data.token).not.toBe(rawToken);
  });
});
