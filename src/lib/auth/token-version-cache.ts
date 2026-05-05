import { Redis } from "@upstash/redis";

/**
 * Token version cache using Upstash Redis.
 * 
 * Purpose: Enable cross-instance session revocation on serverless deployments.
 * When a user resets their password, the token version is invalidated on Redis,
 * causing all active sessions across all Lambda instances to be revoked on their
 * next request. TTL keeps the keys bounded.
 * 
 * TTL: 5 minutes. Password resets are rare events, and a slightly delayed revocation
 * window is an acceptable tradeoff for significantly reduced database load. With active
 * users, a 30-second TTL causes constant cache misses and steady DB hit rate.
 */

const TTL_SECONDS = 5 * 60; // 5 minutes
const KEY_PREFIX = "tv:"; // token version

let redis: Redis | null | undefined;

function getRedis() {
  if (redis !== undefined) return redis;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Upstash Redis is not configured. " +
          "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production."
      );
    }
    redis = null;
    return redis;
  }

  redis = Redis.fromEnv();
  return redis;
}

/**
 * Get the current token version for a user from Redis cache.
 * Returns null if not cached or cache is unavailable.
 */
export async function getTokenVersion(userId: string): Promise<number | null> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return null;

    const version = await redisClient.get<number>(`${KEY_PREFIX}${userId}`);
    return version ?? null;
  } catch (error) {
    console.error("[token-version-cache] Failed to get version:", error);
    return null;
  }
}

/**
 * Set the token version for a user in Redis cache with TTL.
 * Used after validating from the database to reduce DB round-trips.
 */
export async function setTokenVersion(userId: string, version: number): Promise<void> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return;

    await redisClient.set(`${KEY_PREFIX}${userId}`, version, { ex: TTL_SECONDS });
  } catch (error) {
    console.error("[token-version-cache] Failed to set version:", error);
    // Non-fatal: next request will fetch from DB
  }
}

/**
 * Invalidate (revoke) all sessions for a user by deleting the cached token version.
 * Called when password is reset or user signs out from all devices.
 * 
 * Effect: On the user's next request, validateTokenVersion() will not find the cache
 * and will fetch from DB. If tokenVersion was incremented, the JWT will be invalid.
 */
export async function invalidateTokenVersion(userId: string): Promise<void> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return;

    await redisClient.del(`${KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error("[token-version-cache] Failed to invalidate version:", error);
    // Non-fatal: cache will naturally expire after TTL
  }
}
