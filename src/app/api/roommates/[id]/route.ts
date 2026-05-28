import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { reason } = await req.json().catch(() => ({}));
  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

  // Prevent self-report
  const post = await db.roommatePost.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot report your own post" }, { status: 400 });
  }

  await db.roommateReport.upsert({
    where:  { postId_reporterId: { postId, reporterId: session.user.id } },
    create: { postId, reporterId: session.user.id, reason },
    update: { reason },
  });

  return NextResponse.json({ ok: true });
}
