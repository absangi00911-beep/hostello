import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verificationTokenDeleteMany: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  transaction: vi.fn(),
  getIp: vi.fn(),
  rateLimit: vi.fn(),
  createOperationalLogContext: vi.fn(() => ({ request_id: "req_test" })),
  hashOperationalIdentifier: vi.fn(() => "opaque-hash"),
  logOperationalEvent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/lib/rate-limit", () => ({
  getIp: mocks.getIp,
  rateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/operational-logger", () => ({
  createOperationalLogContext: mocks.createOperationalLogContext,
  hashOperationalIdentifier: mocks.hashOperationalIdentifier,
  logOperationalEvent: mocks.logOperationalEvent,
}));

import { authorizeEmailOtp } from "@/lib/auth/email-otp-authorize";
import { getIp, rateLimit } from "@/lib/rate-limit";

const request = new Request("https://hostello.test/api/auth/callback/email-otp", {
  method: "POST",
});
const grant = "a".repeat(64);
const email = "student@example.com";
const activeStudent = {
  id: "student-1",
  email,
  name: "Original Name",
  avatar: null,
  role: "STUDENT",
  emailVerified: null,
  tokenVersion: 0,
  deletionRequestedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", "test-auth-secret");
  vi.mocked(getIp).mockReturnValue("203.0.113.10");
  vi.mocked(rateLimit).mockResolvedValue({
    ok: true,
    remaining: 9,
    resetAt: Date.now() + 60_000,
  });
  mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 1 });
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userCreate.mockResolvedValue({
    ...activeStudent,
    id: "created-student",
    name: "New Student",
    emailVerified: new Date("2026-10-27T00:00:00.000Z"),
  });
  mocks.userUpdate.mockResolvedValue({
    ...activeStudent,
    emailVerified: new Date("2026-10-27T00:00:00.000Z"),
  });
  mocks.transaction.mockImplementation(
    async (callback: (tx: {
      verificationToken: { deleteMany: typeof mocks.verificationTokenDeleteMany };
      user: {
        findUnique: typeof mocks.userFindUnique;
        create: typeof mocks.userCreate;
        update: typeof mocks.userUpdate;
      };
    }) => unknown) =>
      callback({
        verificationToken: { deleteMany: mocks.verificationTokenDeleteMany },
        user: {
          findUnique: mocks.userFindUnique,
          create: mocks.userCreate,
          update: mocks.userUpdate,
        },
      }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authorizeEmailOtp", () => {
  it("rejects malformed credentials before rate limiting or database work", async () => {
    await expect(
      authorizeEmailOtp({ email: "bad", grant: "not-a-grant" }, request),
    ).resolves.toBeNull();

    expect(rateLimit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("redeems the grant atomically and creates a verified Student account with the supplied name", async () => {
    await expect(
      authorizeEmailOtp({ email, grant, name: "New Student" }, request),
    ).resolves.toEqual({
      id: "created-student",
      email,
      name: "New Student",
      image: null,
      role: "STUDENT",
      emailVerified: expect.any(Date),
      tokenVersion: 0,
    });

    expect(mocks.verificationTokenDeleteMany).toHaveBeenCalledWith({
      where: {
        identifier: "email-login-grant:student@example.com",
        token: createHash("sha256").update(grant).digest("hex"),
        expires: { gt: expect.any(Date) },
      },
    });
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email,
        name: "New Student",
        role: "STUDENT",
        emailVerified: expect.any(Date),
      },
    });
  });

  it("preserves existing account name and role when its email is verified by OTP", async () => {
    mocks.userFindUnique.mockResolvedValue({
      ...activeStudent,
      name: "Existing Owner",
      role: "OWNER",
    });
    mocks.userUpdate.mockResolvedValue({
      ...activeStudent,
      name: "Existing Owner",
      role: "OWNER",
      emailVerified: new Date("2026-10-27T00:00:00.000Z"),
    });

    await expect(
      authorizeEmailOtp({ email, grant }, request),
    ).resolves.toMatchObject({
      id: activeStudent.id,
      name: "Existing Owner",
      role: "OWNER",
    });

    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: activeStudent.id },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("rejects a deleted account and consumes its grant", async () => {
    mocks.userFindUnique.mockResolvedValue({
      ...activeStudent,
      deletionRequestedAt: new Date(),
    });

    await expect(authorizeEmailOtp({ email, grant }, request)).resolves.toBeNull();

    expect(mocks.verificationTokenDeleteMany).toHaveBeenCalledTimes(1);
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired grant without creating an account", async () => {
    mocks.verificationTokenDeleteMany.mockResolvedValue({ count: 0 });

    await expect(
      authorizeEmailOtp({ email, grant, name: "New Student" }, request),
    ).resolves.toBeNull();

    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("limits verification attempts before redeeming grants", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    await expect(
      authorizeEmailOtp({ email, grant }, request),
    ).rejects.toThrow("Too many login attempts");

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
