import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  bookingCount: vi.fn(),
  webhookEventCount: vi.fn(),
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});
vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    booking: { count: mocks.bookingCount },
    safepayWebhookEvent: { count: mocks.webhookEventCount },
  },
}));

import { timingSafeEqual } from "node:crypto";
import { GET } from "./route";

const request = (secret?: string) =>
  new Request("https://hostello.test/api/health/payments", {
    headers: secret === undefined ? {} : { "x-cron-health-secret": secret },
  });

describe("GET /api/health/payments x-cron-health-secret", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron_secret_value_1234");
    mocks.auth.mockResolvedValue(null);
    mocks.bookingCount.mockResolvedValue(0);
    mocks.webhookEventCount.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a matching secret without checking the session", async () => {
    const response = await GET(request("cron_secret_value_1234"));

    expect(response.status).toBe(200);
    expect((await response.json()).healthy).toBe(true);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("rejects a same-length secret that differs and falls back to the admin session", async () => {
    const response = await GET(request("cron_secret_value_1235"));

    expect(response.status).toBe(401);
    expect(mocks.auth).toHaveBeenCalledTimes(1);
    expect(mocks.bookingCount).not.toHaveBeenCalled();
  });

  it("rejects a shorter secret with 401 instead of throwing", async () => {
    const response = await GET(request("cron_secret"));

    expect(response.status).toBe(401);
    expect(mocks.bookingCount).not.toHaveBeenCalled();
  });

  it("rejects a longer secret with 401 instead of throwing", async () => {
    const response = await GET(request("cron_secret_value_1234_and_more"));

    expect(response.status).toBe(401);
    expect(mocks.bookingCount).not.toHaveBeenCalled();
  });

  it("compares the header with timingSafeEqual on equal-length buffers, even for different-length input", async () => {
    await GET(request("cron_secret"));

    expect(timingSafeEqual).toHaveBeenCalledTimes(1);
    const [a, b] = vi.mocked(timingSafeEqual).mock.calls[0] as [Buffer, Buffer];
    expect(a.length).toBe(b.length);
  });

  it("rejects a missing header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.bookingCount).not.toHaveBeenCalled();
  });

  it("rejects an empty header even when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const response = await GET(request(""));

    expect(response.status).toBe(401);
    expect(mocks.bookingCount).not.toHaveBeenCalled();
  });

  it("still lets an admin session through when the secret does not match", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });

    const response = await GET(request("wrong"));

    expect(response.status).toBe(200);
  });

  it("rejects a non-admin session when the secret does not match", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user_1", role: "STUDENT" } });

    const response = await GET(request("wrong"));

    expect(response.status).toBe(401);
  });
});
