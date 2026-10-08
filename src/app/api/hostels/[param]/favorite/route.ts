// Path: src/app/api/hostels/[param]/favorite/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam, MAX_HOSTEL_ROUTE_PARAM_LENGTH } from "@/lib/route-params";

const FAVORITE_ACTIONS_PER_MINUTE = 60;

async function getHostelId(param: string) {
  const hostel = await db.hostel.findFirst({
    where: { slug: param, status: "ACTIVE" },
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
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can save hostels." }, { status: 403 });
  }

  const limit = await rateLimit(`favorite:${session.user.id}`, {
    limit: FAVORITE_ACTIONS_PER_MINUTE,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many favorite changes. Try again later." }, { status: 429 });
  }

  const { param } = await params;
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
    return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  }
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
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can remove saved hostels." }, { status: 403 });
  }

  const limit = await rateLimit(`favorite:${session.user.id}`, {
    limit: FAVORITE_ACTIONS_PER_MINUTE,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many favorite changes. Try again later." }, { status: 429 });
  }

  const { param } = await params;
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
    return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  }
  await db.favorite.deleteMany({
    where: {
      userId: session.user.id,
      hostel: { is: { slug: param } },
    },
  });
  return NextResponse.json({ saved: false });
}
