import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/roommates/[id] — remove a post owned by the signed-in user. */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actionLimit = await rateLimit(`roommate-post-delete:${session.user.id}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!actionLimit.ok) {
      return NextResponse.json(
        { error: "Too many post deletion attempts. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((actionLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const { id } = await params;
    if (id.length > 64) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }
    const result = await db.roommatePost.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (result.count !== 1) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/roommates/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
