import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";

interface Entry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const limiters = new Map<string, Ratelimit>();

let redisClient: Redis | null | undefined;
let warnedAboutFallback = false;

const cleanupInterval = typeof setInterval === "function"
  ? setInterval(() => {
      const now = Date.now();
      store.forEach((value, key) => {
        if (value.resetAt < now) {
          store.delete(key);
        }
      });
    }, 5 * 60 * 1000)
  : undefined;

cleanupInterval?.unref?.();

function toWindowString(windowMs: number): Duration {
  if (windowMs % 3_600_000 === 0) {
    return `${windowMs / 3_600_000} h`;
  }

  if (windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`;
  }

  if (windowMs % 1_000 === 0) {
    return `${windowMs / 1_000} s`;
  }

  return `${Math.ceil(windowMs / 1_000)} s`;
}

function getRedis() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

function getUpstashLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) {
    return existing;
  }

  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, toWindowString(windowMs)),
    prefix: "hostello:ratelimit",
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (!limiter) {
    if (!warnedAboutFallback && process.env.NODE_ENV === "production") {
      warnedAboutFallback = true;
      console.warn("[rate-limit] Upstash not configured; using per-instance memory fallback.");
    }

    return rateLimitInMemory(key, limit, windowMs);
  }

  try {
    const result = await limiter.limit(key);

    return {
      ok: result.success,
      remaining: Math.max(0, result.remaining ?? 0),
      resetAt: result.reset,
    };
  } catch (error) {
    console.error("[rate-limit] Upstash request failed, falling back to memory.", error);
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/** Extract a stable IP string from a Next.js request. */
export function getIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
