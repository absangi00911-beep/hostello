import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  verificationTokenDeleteMany: vi.fn(),
  verificationTokenCreate: vi.fn(),
  hash: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.21"),
  sendEmail: vi.fn(),
  verificationEmail: vi.fn((input: { name: string; verifyUrl: string }) => ({
    subject: "Verify email",
    html: input.verifyUrl,
    text: input.verifyUrl,
  })),
  welcomeEmail: vi.fn(() => ({ subject: "Welcome", html: "Welcome", text: "Welcome" })),
  getAppOrigin: vi.fn(() => "https://hostello.test"),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
    verificationToken: {
      deleteMany: mocks.verificationTokenDeleteMany,
      create: mocks.verificationTokenCreate,
    },
  },
}));
vi.mock("bcryptjs", () => ({ hash: mocks.hash }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: mocks.getIp }));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/verification", () => ({ verificationEmail: mocks.verificationEmail }));
vi.mock("@/lib/email-templates/welcome", () => ({ welcomeEmail: mocks.welcomeEmail }));
vi.mock("@/lib/app-url", () => ({ getAppOrigin: mocks.getAppOrigin }));

import { POST } from "@/app/api/auth/signup/route";
import { rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";

const USER = { id: "user-1", name: "A Student", email: "student@example.com", role: "STUDENT" as const };

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60_000 });
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue(USER);
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 0 });
    mocks.verificationTokenCreate.mockResolvedValue({});
    mocks.hash.mockResolvedValue("password-hash");
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("emails the raw verification token but stores only its SHA-256 digest", async () => {
    const response = await POST(new NextRequest("https://hostello.test/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: USER.name,
        email: USER.email,
        password: "A-secure-password-123",
        role: USER.role,
      }),
    }));

    expect(response.status).toBe(201);
    await vi.waitFor(() => expect(mocks.verificationTokenCreate).toHaveBeenCalled());

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
