import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";

const VALID_PLATFORMS = ["ios", "android"] as const;

/**
 * POST /api/device-tokens
 * Register or refresh a push token for the authenticated user.
 * Safe to call on every login — upserts by token value.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await rateLimit(`device-token:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) return NextResponse.json({ error: "Too many device registrations. Try again later." }, { status: 429 });

  const body = await readBoundedJson(req, 2_048);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { token, platform } = body.data as { token?: unknown; platform?: unknown };

  if (typeof token !== "string" || token.length < 1 || token.length > 1_024) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  if (typeof platform !== "string" || !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])) {
    return NextResponse.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
  }

  await db.deviceToken.upsert({
    where: { token },
    create: { token, platform, userId: session.user.id },
    // If the token already exists for a different user (re-install scenario),
    // update the userId so the correct person gets notifications.
    update: { userId: session.user.id, platform, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/device-tokens
 * Unregister a token on sign-out so the user stops receiving notifications.
 * Accepts a JSON body for the canonical route and a token query parameter for
 * compatibility with the older /api/notifications/device-token route.
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await rateLimit(`device-token:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many device-token changes. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const body = await readBoundedJson(req, 2_048);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const bodyData = body.data && typeof body.data === "object" && !Array.isArray(body.data)
    ? body.data as Record<string, unknown>
    : {};
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  const token = typeof bodyData.token === "string" ? bodyData.token : queryToken;
  if (url.search.length > 1_200) return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  if (!token || token.length > 1_024) return NextResponse.json({ error: "token is required" }, { status: 400 });

  // Only delete if it belongs to this user
  await db.deviceToken.deleteMany({
    where: { token, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
