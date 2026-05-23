import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnerHostel(hostelId: string, ownerId: string) {
  return db.hostel.findFirst({
    where: {
      id: hostelId,
      // Admins can also manage — drop ownerId filter for them if needed
      ownerId,
    },
    select: { id: true },
  });
}

/** GET — list all blocked ranges for a hostel */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hostel = await getOwnerHostel(id, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocked = await db.blockedDate.findMany({
    where: { hostelId: id },
    orderBy: { startDate: "asc" },
    select: { id: true, startDate: true, endDate: true, reason: true },
  });

  return NextResponse.json({ data: blocked });
}

/** POST — add a blocked date range */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hostel = await getOwnerHostel(id, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { startDate, endDate, reason } = body;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ error: "endDate must be on or after startDate" }, { status: 400 });
  }

  const blocked = await db.blockedDate.create({
    data: {
      hostelId: id,
      startDate: start,
      endDate:   end,
      reason:    reason ?? null,
    },
    select: { id: true, startDate: true, endDate: true, reason: true },
  });

  return NextResponse.json({ data: blocked }, { status: 201 });
}

/** DELETE — remove a blocked range by id */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: hostelId } = await params;
  const hostel = await getOwnerHostel(hostelId, session.user.id);
  if (!hostel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.blockedDate.deleteMany({
    where: { id, hostelId },   // scoped to hostel — prevents cross-owner deletion
  });

  return NextResponse.json({ ok: true });
}
