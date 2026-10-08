import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const tx = {
    verificationToken: { deleteMany: vi.fn() },
    user: { updateMany: vi.fn(), findUnique: vi.fn() },
  };
  return {
    tx,
    verificationTokenFindFirst: vi.fn(),
    transaction: vi.fn(async (operation: (client: typeof tx) => unknown) => operation(tx)),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      findFirst: mocks.verificationTokenFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.21"),
  rateLimit: vi.fn(),
}));

import { GET, POST } from "@/app/api/auth/verify-email/route";
import { rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";

const TOKEN = "a".repeat(64);
const TOKEN_HASH = hashOneTimeToken(TOKEN);
const EMAIL = "student@example.com";

describe("/api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
    mocks.verificationTokenFindFirst.mockResolvedValue({
      token: TOKEN_HASH,
      identifier: EMAIL,
      expires: new Date(Date.now() + 60_000),
    });
    mocks.tx.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    mocks.tx.user.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.user.findUnique.mockResolvedValue(null);
  });

  it("renders a confirmation form on GET without consuming the token", async () => {
    const response = await GET(new NextRequest(
      `https://hostello.test/api/auth/verify-email?token=${TOKEN}`,
    ));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Verify your email");
    expect(html).toContain('method="post"');
    expect(html).toContain('name="confirm" value="verify"');
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.verificationTokenFindFirst).toHaveBeenCalledWith({
      where: { token: { in: [TOKEN_HASH, TOKEN] } },
      select: { expires: true },
    });
  });

  it("throttles token previews before querying the token store", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(new NextRequest(
      `https://hostello.test/api/auth/verify-email?token=${TOKEN}`,
    ));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(mocks.verificationTokenFindFirst).not.toHaveBeenCalled();
  });

  it("consumes the token and verifies the email only after a bounded POST", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/auth/verify-email",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "verify" }),
      },
    ));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?verified=1");
    expect(mocks.tx.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { token: TOKEN_HASH, identifier: EMAIL, expires: { gt: expect.any(Date) } },
    });
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { email: EMAIL, emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("throttles verification POSTs before parsing the form or consuming the token", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await POST(new NextRequest(
      "https://hostello.test/api/auth/verify-email",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "verify" }),
      },
    ));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(mocks.verificationTokenFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a GET token preview when the token has expired without changing state", async () => {
    mocks.verificationTokenFindFirst.mockResolvedValue({
      token: TOKEN,
      identifier: EMAIL,
      expires: new Date(Date.now() - 60_000),
    });

    const response = await GET(new NextRequest(
      `https://hostello.test/api/auth/verify-email?token=${TOKEN}`,
    ));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=expired-token");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects an unconfirmed POST without consuming the token", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/auth/verify-email",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN }),
      },
    ));

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("continues to consume older links whose raw token is still stored", async () => {
    mocks.verificationTokenFindFirst.mockResolvedValue({
      token: TOKEN,
      identifier: EMAIL,
      expires: new Date(Date.now() + 60_000),
    });

    const response = await POST(new NextRequest(
      "https://hostello.test/api/auth/verify-email",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "verify" }),
      },
    ));

    expect(response.status).toBe(303);
    expect(mocks.tx.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { token: TOKEN, identifier: EMAIL, expires: { gt: expect.any(Date) } },
    });
  });
});
