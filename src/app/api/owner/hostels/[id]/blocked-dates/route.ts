import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { blockedDateSchema } from "@hostello/shared";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination } from "@/lib/pagination";
import { isBoundedRouteParam } from "@/lib/route-params";
import {
  createOwnerBlockedDate,
  lockHostelInventory,
} from "@/lib/room-availability-service";
import { reevaluateAvailabilityAlertsForHostel } from "@/lib/availability-alerts";

type Ctx = { params: Promise<{ id: string }> };
const MAX_BODY_BYTES = 2_048;
const MAX_REASON_LENGTH = 250;

async function getOwnerHostel(hostelId: string, ownerId: string) {
  return db.hostel.findFirst({
    where: {
      id: hostelId,
      // Blocked-date access is scoped to the hostel's owning account.
      ownerId,
    },
    select: { id: true },
  });
}

/** GET — return one bounded page of blocked ranges for a hostel */
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!isBoundedRouteParam(id)) return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  const hostel = await getOwnerHostel(id, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }
  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
    defaultLimit: 20,
    maxLimit: 50,
  });

  const [blocked, total] = await Promise.all([
    db.blockedDate.findMany({
      where: { hostelId: id, hostel: { is: { ownerId: session.user.id } } },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      skip,
      take: limit,
      select: { id: true, startDate: true, endDate: true, reason: true },
    }),
    db.blockedDate.count({
      where: { hostelId: id, hostel: { is: { ownerId: session.user.id } } },
    }),
  ]);

  return NextResponse.json({
    data: blocked,
    page,
    limit,
    total,
    hasMore: skip + blocked.length < total,
  });
}

/** POST — add a blocked date range */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!isBoundedRouteParam(id)) return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  const hostel = await getOwnerHostel(id, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const limit = await rateLimit(`blocked-dates:${session.user.id}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many calendar changes. Try again later." }, { status: 429 });
  }

  const parsed = await readBoundedJson(req, MAX_BODY_BYTES);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = parsed.data as Record<string, unknown>;
  const { startDate, endDate } = body;

  if (typeof startDate !== "string" || typeof endDate !== "string" || !startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  if (
    body.reason !== undefined &&
    body.reason !== null &&
    (typeof body.reason !== "string" || body.reason.length > MAX_REASON_LENGTH)
  ) {
    return NextResponse.json(
      { error: `reason must be at most ${MAX_REASON_LENGTH} characters.` },
      { status: 400 },
    );
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

  const dateRange = blockedDateSchema.safeParse({ startDate, endDate });
  if (!dateRange.success) {
    return NextResponse.json({ error: "Provide valid inclusive calendar dates." }, { status: 400 });
  }
  const { startDate: start, endDate: end } = dateRange.data;
  const result = await db.$transaction(async (tx) => {
    return createOwnerBlockedDate(tx, {
      hostelId: hostel.id,
      ownerId: session.user.id,
      startDate: start,
      endDate: end,
      reason,
    });
  });

  if (result.kind === "missing") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (result.kind === "conflict") {
    return NextResponse.json(
      { error: "This block overlaps an active booking hold. Change the range or resolve the booking first." },
      { status: 409 },
    );
  }

  await reevaluateAvailabilityAlertsForHostel(hostel.id);
  return NextResponse.json({ data: result.blocked }, { status: 201 });
}

/** DELETE — remove a blocked range by id */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: hostelId } = await params;
  if (!isBoundedRouteParam(hostelId)) return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
  const hostel = await getOwnerHostel(hostelId, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const limit = await rateLimit(`blocked-dates:${session.user.id}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many calendar changes. Try again later." }, { status: 429 });
  }

  const parsed = await readBoundedJson(req, 1_024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = (parsed.data as Record<string, unknown>).id;
  if (typeof id !== "string" || id.length < 1 || id.length > 128) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deletedCount = await db.$transaction(async (tx) => {
    if (!await lockHostelInventory(tx, hostelId)) return;
    const deleted = await tx.blockedDate.deleteMany({
      where: {
        id,
        hostelId,
        hostel: { is: { ownerId: session.user.id } },
      },
    });
    return deleted.count;
  });
  if (deletedCount && deletedCount > 0) {
    await reevaluateAvailabilityAlertsForHostel(hostelId);
  }

  return NextResponse.json({ ok: true });
}
