import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const tx = {
    passwordResetToken: { updateMany: vi.fn() },
    user: { update: vi.fn() },
  };
  return {
    tx,
    tokenFindFirst: vi.fn(),
    transaction: vi.fn(async (operation: (client: typeof tx) => unknown) => operation(tx)),
    rateLimit: vi.fn(),
    getIp: vi.fn(() => "203.0.113.1"),
    passwordHash: vi.fn(async () => "password-hash"),
    invalidateLocalSessionCache: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: { findFirst: mocks.tokenFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: mocks.getIp }));
vi.mock("bcryptjs", () => ({ hash: mocks.passwordHash }));
vi.mock("@/lib/auth/config", () => ({
  invalidateLocalSessionCache: mocks.invalidateLocalSessionCache,
}));

import { POST } from "@/app/api/auth/reset-password/route";

const TOKEN = "c".repeat(64);
const TOKEN_HASH = createHash("sha256").update(TOKEN).digest("hex");
const RECORD = {
  id: "reset-1",
  token: TOKEN_HASH,
  userId: "user-1",
  usedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
};

function makeRequest(token = TOKEN) {
  return new NextRequest("https://hostello.test/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: "StrongPassword123!" }),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60_000 });
    mocks.tokenFindFirst.mockResolvedValue(RECORD);
    mocks.tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.user.update.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (operation) => operation(mocks.tx));
    mocks.invalidateLocalSessionCache.mockResolvedValue(undefined);
  });

  it("looks up a digest first and atomically claims the token before changing the password", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(mocks.tokenFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ token: TOKEN_HASH }, { token: TOKEN }] },
    }));
    expect(mocks.tx.passwordResetToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: RECORD.id, usedAt: null, expiresAt: { gt: expect.any(Date) } },
    }));
    expect(mocks.tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: RECORD.userId },
      data: { password: "password-hash", tokenVersion: { increment: 1 } },
    }));
    expect(mocks.invalidateLocalSessionCache).toHaveBeenCalledWith(RECORD.userId);
  });

  it("rejects a token another request has already claimed", async () => {
    mocks.tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid or expired link." });
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
    expect(mocks.invalidateLocalSessionCache).not.toHaveBeenCalled();
  });

  it("accepts a still-valid pre-hashing token through the legacy fallback", async () => {
    mocks.tokenFindFirst.mockResolvedValue({ ...RECORD, token: TOKEN });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(mocks.tokenFindFirst.mock.calls[0][0].where.OR).toEqual([
      { token: TOKEN_HASH },
      { token: TOKEN },
    ]);
  });

  it("rejects an expired token without claiming it or changing the password", async () => {
    mocks.tokenFindFirst.mockResolvedValue({ ...RECORD, expiresAt: new Date(Date.now() - 1) });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(mocks.tx.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("rejects malformed tokens before reading the database", async () => {
    const response = await POST(makeRequest("short"));

    expect(response.status).toBe(400);
    expect(mocks.tokenFindFirst).not.toHaveBeenCalled();
  });
});
