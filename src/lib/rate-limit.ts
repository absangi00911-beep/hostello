/**
 * Lightweight in-memory rate limiter.
 *
 * Works per-server-instance — good enough for a single Vercel
 * deployment or dev. Swap for Upstash Redis when running multiple
 * instances at scale (the interface stays identical).
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 5, windowMs: 15 * 60 * 1000 });
 *   if (!result.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
 */

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes so the Map doesn't grow forever
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((v, k) => { if (v.resetAt < now) store.delete(k); });
  }, 5 * 60 * 1000);
}

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number; resetAt: number } {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, remaining, resetAt: entry.resetAt };
}

/** Extract a stable IP string from a Next.js request. */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
