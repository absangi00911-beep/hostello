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
