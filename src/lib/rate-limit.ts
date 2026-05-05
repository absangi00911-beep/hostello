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

// Cleanup stale entries every 5 minutes. Call .unref() so the timer doesn't
// prevent Node.js from exiting (important for serverless cold starts).
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  store.forEach((value, key) => {
    if (value.resetAt < now) store.delete(key);
  });
}, 5 * 60 * 1000);

cleanupInterval.unref();

function toWindowString(windowMs: number): Duration {
  if (windowMs % 3_600_000 === 0) return `${windowMs / 3_600_000} h`;
  if (windowMs % 60_000 === 0) return `${windowMs / 60_000} m`;
  if (windowMs % 1_000 === 0) return `${windowMs / 1_000} s`;
  return `${Math.ceil(windowMs / 1_000)} s`;
}

function getRedis() {
  if (redisClient !== undefined) return redisClient;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Upstash Redis is not configured. " +
          "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.",
      );
    }
    redisClient = null;
    return redisClient;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

function getUpstashLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const redis = getRedis();
  if (!redis) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, toWindowString(windowMs)),
    prefix: "hostello:ratelimit",
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
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
  { limit = 10, windowMs = 60_000 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);

  if (!limiter) {
    // Development only — no Redis configured
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
    console.error("[rate-limit] Upstash request failed:", error);

    if (process.env.NODE_ENV === "production") {
      // Fail open with a warning: better to allow traffic than lock out all users
      // during a Redis outage. Per-instance in-memory fallback is unreliable
      // across distributed deployments, so we accept the degraded behavior
      // as preferable to a complete service outage.
      console.error("[rate-limit] Redis unavailable — failing open");
      return { ok: true, remaining: 1, resetAt: Date.now() + windowMs };
    }

    // Development: fall back gracefully so local work isn't interrupted
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/**
 * Extract a stable IP string from a Next.js request.
 * Prioritises Cloudflare CF-Connecting-IP (cannot be spoofed),
 * then the rightmost X-Forwarded-For entry (set by your proxy).
 */
export function getIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    const rightmost = ips[ips.length - 1];
    if (rightmost && rightmost !== "unknown") return rightmost;
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}