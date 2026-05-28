import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ param: string }> };

const MAX_BIO = 200;
const EXPIRY_DAYS = 30;
const AUTO_HIDE_REPORTS = 3;

async function resolveHostel(param: string) {
  return db.hostel.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ id: param }, { slug: param }],
    },
    select: { id: true, name: true, ownerId: true },
  });
}

/** GET — active, non-expired posts with < AUTO_HIDE_REPORTS reports */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { param } = await params;
  const hostel = await resolveHostel(param);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await db.roommatePost.findMany({
    where: {
      hostelId: hostel.id,
      expiresAt: { gt: new Date() },
      reports: { none: {} },   // hide if reported (refined below)
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      bio: true,
      budget: true,
      moveIn: true,
      expiresAt: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true, avatar: true, city: true } },
      _count: { select: { reports: true } },
    },
  });

  // Filter out posts with too many reports
  const visible = posts.filter((p) => p._count.reports < AUTO_HIDE_REPORTS);

  return NextResponse.json({ data: visible });
}

/** POST — create or update (upsert) the current user's post for this hostel */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { param } = await params;
  const hostel = await resolveHostel(param);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const bio    = typeof body.bio    === "string" ? body.bio.trim().slice(0, MAX_BIO) : "";
  const budget = typeof body.budget === "number" && body.budget > 0 ? body.budget : null;
  const moveIn = body.moveIn ? new Date(body.moveIn) : null;

  if (!bio) return NextResponse.json({ error: "bio is required" }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const post = await db.roommatePost.upsert({
    where:  { hostelId_userId: { hostelId: hostel.id, userId: session.user.id } },
    create: { hostelId: hostel.id, userId: session.user.id, bio, budget, moveIn, expiresAt },
    update: { bio, budget, moveIn, expiresAt },   // refreshes the 30-day window on edit
    select: {
      id: true, bio: true, budget: true, moveIn: true, expiresAt: true, createdAt: true, userId: true,
      user: { select: { id: true, name: true, avatar: true, city: true } },
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}
