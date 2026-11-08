import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  accountExistsEmail: vi.fn(() => ({ subject: "Already registered", html: "exists", text: "exists" })),
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
vi.mock("@/lib/email-templates/account-exists", () => ({ accountExistsEmail: mocks.accountExistsEmail }));

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
    vi.stubEnv("AUTH_SECRET", "test-auth-secret");
  });

  afterEach(() => vi.unstubAllEnvs());

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

  it("has stored the verification token by the time it responds", async () => {
    let tokenStored = false;
    mocks.verificationTokenCreate.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      tokenStored = true;
      return {};
    });

    const response = await POST(new NextRequest("https://hostello.test/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: USER.name, email: USER.email, password: "A-secure-password-123", role: USER.role }),
    }));

    expect(response.status).toBe(201);
    expect(tokenStored).toBe(true);
  });

  it("still creates the account, and skips only the verification email, when the token cannot be stored", async () => {
    mocks.verificationTokenCreate.mockRejectedValue(new Error("database unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(new NextRequest("https://hostello.test/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: USER.name, email: USER.email, password: "A-secure-password-123", role: USER.role }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.verificationEmail).not.toHaveBeenCalled();
    expect(mocks.welcomeEmail).toHaveBeenCalled();
  });

  describe("when the email is already registered", () => {
    const EXISTING = { id: "user-9", name: "Existing Owner", email: USER.email, role: "OWNER" as const };
    const signup = () =>
      POST(new NextRequest("https://hostello.test/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Someone Else", email: USER.email, password: "A-secure-password-123", role: "STUDENT" }),
      }));

    beforeEach(() => mocks.userFindUnique.mockResolvedValue(EXISTING));

    it("returns exactly the response a new signup gets and creates nothing", async () => {
      const existingResponse = await signup();
      const existingBody = await existingResponse.json();

      mocks.userFindUnique.mockResolvedValue(null);
      const newResponse = await signup();
      const newBody = await newResponse.json();

      expect(existingResponse.status).toBe(201);
      expect(existingResponse.status).toBe(newResponse.status);
      expect(existingBody).toEqual(newBody);
      expect(JSON.stringify(existingBody)).not.toContain(EXISTING.id);
      expect(mocks.userCreate).toHaveBeenCalledTimes(1); // only the genuinely new signup
    });

    it("pays the same password-hash cost so timing does not reveal the account", async () => {
      await signup();

      expect(mocks.hash).toHaveBeenCalledWith("A-secure-password-123", 12);
    });

    it("notifies the existing owner, not the requester, and sends no verification or welcome email", async () => {
      await signup();
      await vi.waitFor(() => expect(mocks.sendEmail).toHaveBeenCalledTimes(1));

      expect(mocks.accountExistsEmail).toHaveBeenCalledWith({
        name: EXISTING.name,
        loginUrl: "https://hostello.test/login",
        resetUrl: "https://hostello.test/forgot-password",
      });
      expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: EXISTING.email }));
      expect(mocks.verificationEmail).not.toHaveBeenCalled();
      expect(mocks.welcomeEmail).not.toHaveBeenCalled();
      expect(mocks.verificationTokenCreate).not.toHaveBeenCalled();
    });

    it("sends at most one notice per address per hour, keyed without the raw email", async () => {
      vi.mocked(rateLimit)
        .mockResolvedValueOnce({ ok: true, remaining: 4, resetAt: 0 }) // per-IP signup limit
        .mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: 1 }); // per-address notice limit

      const response = await signup();
      await vi.waitFor(() => expect(rateLimit).toHaveBeenCalledTimes(2));

      expect(response.status).toBe(201);
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      const [key, options] = vi.mocked(rateLimit).mock.calls[1];
      expect(String(key)).toMatch(/^signup-exists:[a-f0-9]{64}$/);
      expect(String(key)).not.toContain("student");
      expect(options).toEqual({ limit: 1, windowMs: 60 * 60 * 1000 });
    });
  });
});
