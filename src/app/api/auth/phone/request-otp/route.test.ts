import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  deleteTokens: vi.fn(),
  createToken: vi.fn(),
  sendOtpSms: vi.fn(),
  normalizePhoneNumber: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/db", () => ({
  db: { phoneVerificationToken: { deleteMany: mocks.deleteTokens, create: mocks.createToken } },
}));
vi.mock("@/lib/sms", () => ({
  generateOTP: vi.fn(() => "123456"),
  normalizePhoneNumber: mocks.normalizePhoneNumber,
  sendOtpSms: mocks.sendOtpSms,
}));

import { POST } from "./route";

function request(phone = "03001234567") {
  return new NextRequest("https://hostello.test/api/auth/phone/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

describe("POST /api/auth/phone/request-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60_000 });
    mocks.normalizePhoneNumber.mockReturnValue("+923001234567");
    mocks.deleteTokens.mockResolvedValue({ count: 0 });
    mocks.createToken.mockResolvedValue({});
    mocks.sendOtpSms.mockResolvedValue({ success: true, dev: false });
  });

  it("rejects anonymous requests before rate limits, storage, or paid SMS delivery", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.deleteTokens).not.toHaveBeenCalled();
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("stores and sends the OTP bound to the signed-in user", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.deleteTokens).toHaveBeenCalledWith({
      where: { phone: "+923001234567", userId: "student-1" },
    });
    expect(mocks.createToken).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: "+923001234567",
        otp: "123456",
        userId: "student-1",
      }),
    });
    expect(mocks.sendOtpSms).toHaveBeenCalledWith("+923001234567", "123456");
  });
});
