import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  slidingWindow: vi.fn((limit: number, duration: string) => ({ limit, duration })),
  redisFromEnv: vi.fn(() => ({})),
}));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: mocks.redisFromEnv },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = mocks.slidingWindow;
    limit = mocks.limit;
  },
}));

describe("rateLimit Redis outage fallback", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    mocks.limit.mockRejectedValue(Object.assign(new Error("private connection detail"), { code: "ECONNRESET" }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockClear();
  });

  it("continues enforcing the limit in memory when Redis rejects requests", async () => {
    const { rateLimit } = await import("./rate-limit");

    const first = await rateLimit("signup:203.0.113.10", { limit: 2, windowMs: 60_000 });
    const second = await rateLimit("signup:203.0.113.10", { limit: 2, windowMs: 60_000 });
    const third = await rateLimit("signup:203.0.113.10", { limit: 2, windowMs: 60_000 });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third).toMatchObject({ ok: false, remaining: 0 });
    expect(mocks.limit).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalledTimes(6);
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("private connection detail");
  });
});

describe("rateLimit failClosed", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockClear();
  });

  it("refuses every request in production when Redis is unreachable, with no per-instance budget", async () => {
    mocks.limit.mockRejectedValue(Object.assign(new Error("private connection detail"), { code: "ECONNRESET" }));
    const { rateLimit } = await import("./rate-limit");
    const before = Date.now();

    const results = await Promise.all(
      [1, 2, 3].map(() => rateLimit("login-ip:203.0.113.10", { limit: 5, windowMs: 60_000, failClosed: true })),
    );

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, remaining: 0, unavailable: true });
      expect(result.resetAt).toBeGreaterThan(before);
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 30_000);
    }
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("private connection detail");
  });

  it("caps the suggested retry delay at the window for short windows", async () => {
    mocks.limit.mockRejectedValue(new Error("down"));
    const { rateLimit } = await import("./rate-limit");

    const result = await rateLimit("otp:x", { limit: 1, windowMs: 5_000, failClosed: true });

    expect(result.resetAt - Date.now()).toBeLessThanOrEqual(5_000);
  });

  it("behaves normally while Redis is healthy", async () => {
    mocks.limit.mockResolvedValue({ success: true, remaining: 4, reset: 123 });
    const { rateLimit } = await import("./rate-limit");

    expect(await rateLimit("login-ip:a", { limit: 5, failClosed: true })).toEqual({
      ok: true,
      remaining: 4,
      resetAt: 123,
    });
  });

  it("still blocks when Redis reports the limit is exceeded", async () => {
    mocks.limit.mockResolvedValue({ success: false, remaining: 0, reset: 456 });
    const { rateLimit } = await import("./rate-limit");

    const result = await rateLimit("login-ip:a", { limit: 5, failClosed: true });

    expect(result).toEqual({ ok: false, remaining: 0, resetAt: 456 });
    expect(result.unavailable).toBeUndefined();
  });

  it("keeps the in-memory fallback in development so local work is not interrupted", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.limit.mockRejectedValue(new Error("down"));
    const { rateLimit } = await import("./rate-limit");

    expect((await rateLimit("login-ip:dev", { limit: 2, windowMs: 60_000, failClosed: true })).ok).toBe(true);
  });

  it("leaves routes that do not opt in on the in-memory fallback", async () => {
    mocks.limit.mockRejectedValue(new Error("down"));
    const { rateLimit } = await import("./rate-limit");

    const first = await rateLimit("hostel-search:203.0.113.10", { limit: 2, windowMs: 60_000 });
    expect(first.ok).toBe(true);
    expect(first.unavailable).toBeUndefined();
  });
});

describe("rateLimit production configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses to run without Redis in production", async () => {
    const { rateLimit } = await import("./rate-limit");

    await expect(
      rateLimit("signup:203.0.113.10", { limit: 2, windowMs: 60_000 }),
    ).rejects.toThrow(/Upstash Redis is not configured/);
  });

  it("does not let HOSTELLO_E2E relax the production Redis requirement", async () => {
    vi.stubEnv("HOSTELLO_E2E", "1");
    const { rateLimit } = await import("./rate-limit");

    await expect(
      rateLimit("signup:203.0.113.10", { limit: 2, windowMs: 60_000 }),
    ).rejects.toThrow(/Upstash Redis is not configured/);
  });
});
