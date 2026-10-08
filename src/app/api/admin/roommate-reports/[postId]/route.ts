import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

type RouteContext = { params: Promise<{ postId: string }> };

/** DELETE a reported roommate post after admin review. */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const moderationLimit = await rateLimit(`admin-roommate-moderation:${session.user.id}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!moderationLimit.ok) {
      return NextResponse.json(
        { error: "Too many roommate moderation actions. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((moderationLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const { postId } = await params;
    if (!isBoundedRouteParam(postId)) {
      return NextResponse.json({ error: "Invalid reported post." }, { status: 400 });
    }
    const result = await db.roommatePost.deleteMany({
      where: { id: postId, reports: { some: {} } },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Reported post not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/roommate-reports/[postId]]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
