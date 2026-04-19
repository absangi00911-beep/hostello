import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

async function getHostelId(param: string) {
  const hostel = await db.hostel.findUnique({
    where: { slug: param },
    select: { id: true },
  });
  return hostel?.id ?? null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { param } = await params;
  const hostelId = await getHostelId(param);
  if (!hostelId) return NextResponse.json({ error: "Hostel not found" }, { status: 404 });

  await db.favorite.upsert({
    where: { userId_hostelId: { userId: session.user.id, hostelId } },
    update: {},
    create: { userId: session.user.id, hostelId },
  });

  return NextResponse.json({ saved: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { param } = await params;
  const hostelId = await getHostelId(param);
  if (!hostelId) return NextResponse.json({ error: "Hostel not found" }, { status: 404 });

  await db.favorite.deleteMany({
    where: { userId: session.user.id, hostelId },
  });

  return NextResponse.json({ saved: false });
}
