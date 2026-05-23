import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const VALID_PLATFORMS = ["ios", "android"] as const;

/**
 * POST /api/device-tokens
 * Register or refresh a push token for the authenticated user.
 * Safe to call on every login — upserts by token value.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { token, platform } = body as { token?: string; platform?: string };

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  if (!platform || !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])) {
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
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  // Only delete if it belongs to this user
  await db.deviceToken.deleteMany({
    where: { token, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
