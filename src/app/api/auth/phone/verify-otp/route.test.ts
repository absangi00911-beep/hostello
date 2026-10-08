import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const tx = {
    phoneVerificationToken: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
  };
  return {
    tx,
    auth: vi.fn(),
    tokenFindFirst: vi.fn(),
    tokenDeleteMany: vi.fn(),
    tokenUpdateMany: vi.fn(),
    transaction: vi.fn(async (operation: (client: typeof tx) => unknown) => operation(tx)),
  };
});

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    phoneVerificationToken: {
      findFirst: mocks.tokenFindFirst,
      deleteMany: mocks.tokenDeleteMany,
      updateMany: mocks.tokenUpdateMany,
    },
    $transaction: mocks.transaction,
  },
}));

import { POST } from "@/app/api/auth/phone/verify-otp/route";

const TOKEN = {
  phone: "+923001234567",
  otp: "123456",
  attempts: 0,
  expires: new Date(Date.now() + 60_000),
  userId: "user-1",
};

function makeRequest(otp: string) {
  return new NextRequest("https://hostello.test/api/auth/phone/verify-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: "03001234567", otp }),
  });
}

describe("POST /api/auth/phone/verify-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "STUDENT" } });
    mocks.tokenFindFirst.mockResolvedValue(TOKEN);
    mocks.tokenDeleteMany.mockResolvedValue({ count: 1 });
    mocks.tokenUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tx.phoneVerificationToken.deleteMany.mockResolvedValue({ count: 1 });
    mocks.tx.user.update.mockResolvedValue({
      id: "user-1",
      phone: "+923001234567",
      phoneVerified: new Date(),
    });
    mocks.transaction.mockImplementation(async (operation) => operation(mocks.tx));
  });

  it("claims a failed attempt with an atomic cap and expiry condition", async () => {
    mocks.tokenFindFirst.mockResolvedValue({ ...TOKEN, attempts: 4 });

    const response = await POST(makeRequest("000000"));

    expect(response.status).toBe(400);
    expect(mocks.tokenUpdateMany).toHaveBeenCalledWith({
      where: {
        phone: TOKEN.phone,
        otp: TOKEN.otp,
        userId: "user-1",
        attempts: { lt: 5 },
        expires: { gt: expect.any(Date) },
      },
      data: { attempts: { increment: 1 } },
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not proceed when another wrong attempt consumes the last slot", async () => {
    mocks.tokenFindFirst.mockResolvedValue({ ...TOKEN, attempts: 4 });
    mocks.tokenUpdateMany.mockResolvedValue({ count: 0 });

    const response = await POST(makeRequest("000000"));

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("claims a correct OTP once in the same transaction as the user update", async () => {
    const response = await POST(makeRequest("123456"));

    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.phoneVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: {
        phone: TOKEN.phone,
        userId: "user-1",
        otp: "123456",
        attempts: { lt: 5 },
        expires: { gt: expect.any(Date) },
      },
    });
    expect(mocks.tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" },
      data: {
        phone: "+923001234567",
        phoneVerified: expect.any(Date),
      },
    }));
  });

  it("rejects a correct code another request already claimed", async () => {
    mocks.tx.phoneVerificationToken.deleteMany.mockResolvedValue({ count: 0 });

    const response = await POST(makeRequest("123456"));

    expect(response.status).toBe(400);
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });
});
