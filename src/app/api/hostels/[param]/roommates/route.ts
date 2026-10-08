import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { ROOMMATE_POST_HIDE_REPORT_THRESHOLD } from "@/lib/roommate-policy";
import { isBoundedRouteParam, MAX_HOSTEL_ROUTE_PARAM_LENGTH } from "@/lib/route-params";

type Ctx = { params: Promise<{ param: string }> };

const MAX_BIO = 200;
const MAX_BODY_BYTES = 4_096;
const MAX_VISIBLE_POSTS = 20;
const MAX_POSTS_SCANNED = 100;
const EXPIRY_DAYS = 30;

async function resolveHostel(param: string) {
  return db.hostel.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ id: param }, { slug: param }],
    },
    select: { id: true, name: true, ownerId: true },
  });
}

/** GET — active, non-expired posts below the report hide threshold. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Sign in as a student to view roommate posts" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Roommate details are available to students only" }, { status: 403 });
  }

  const { param } = await params;
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
    return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  }
  const hostel = await resolveHostel(param);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await db.roommatePost.findMany({
    where: {
      hostelId: hostel.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_POSTS_SCANNED,
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

  // A post remains visible until three distinct students have reported it.
  const visible = posts
    .filter((p) => p._count.reports < ROOMMATE_POST_HIDE_REPORT_THRESHOLD)
    .slice(0, MAX_VISIBLE_POSTS);

  return NextResponse.json({ data: visible });
}

/** POST — create or update (upsert) the current user's post for this hostel */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can post roommate requests" }, { status: 403 });
  }

  const limit = await rateLimit(`roommate-post:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many edits. Please try again later." }, { status: 429 });
  }

  const parsed = await readBoundedJson(req, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return NextResponse.json({ error: "Invalid roommate post." }, { status: 400 });
  }
  const body = parsed.data as Record<string, unknown>;

  const bio    = typeof body.bio    === "string" ? body.bio.trim().slice(0, MAX_BIO) : "";
  if (
    body.budget !== undefined &&
    body.budget !== null &&
    (typeof body.budget !== "number" ||
      !Number.isSafeInteger(body.budget) ||
      body.budget > 2_147_483_647)
  ) {
    return NextResponse.json(
      { error: "budget must be a positive whole number." },
      { status: 400 },
    );
  }
  const budget = typeof body.budget === "number" && body.budget > 0 ? body.budget : null;

  let moveIn: Date | null = null;
  if (body.moveIn !== undefined && body.moveIn !== null && body.moveIn !== "") {
    if (typeof body.moveIn !== "string") {
      return NextResponse.json({ error: "moveIn must be a date." }, { status: 400 });
    }
    moveIn = new Date(body.moveIn);
    if (!Number.isFinite(moveIn.getTime())) {
      return NextResponse.json({ error: "moveIn must be a valid date." }, { status: 400 });
    }
  }

  if (!bio) return NextResponse.json({ error: "bio is required" }, { status: 400 });

  const { param } = await params;
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) {
    return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  }
  const hostel = await resolveHostel(param);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
