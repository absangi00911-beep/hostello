// Path: src/app/api/bookings/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { createBooking } from "@/lib/booking-service";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const hostelId = url.searchParams.get("hostelId");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
    const skip = (page - 1) * limit;

    if (status && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const role = session.user.role;
    const userId = session.user.id;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    if (role === "STUDENT") {
      where.userId = userId;
      if (hostelId) where.hostelId = hostelId;
    } else if (role === "OWNER") {
      if (hostelId) {
        const hostel = await db.hostel.findUnique({
          where: { id: hostelId },
          select: { id: true, ownerId: true },
        });

        if (!hostel || hostel.ownerId !== userId) {
          return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
        }

        where.hostelId = hostel.id;
      } else {
        const hostels = await db.hostel.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });

        if (hostels.length === 0) {
          return NextResponse.json({
            data: [],
            total: 0,
            page,
            limit,
            hasMore: false,
          });
        }

        where.hostelId = { in: hostels.map((hostel) => hostel.id) };
      }
    } else if (hostelId) {
      where.hostelId = hostelId;
    }

    const include =
      role === "STUDENT"
        ? {
            hostel: {
              select: { id: true, name: true, slug: true, coverImage: true, city: true, latitude: true, longitude: true },
            },
          }
        : {
            hostel: {
              select: { id: true, name: true, slug: true, coverImage: true, city: true, latitude: true, longitude: true },
            },
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          };

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include,
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      total,
      page,
      limit,
      hasMore: skip + bookings.length < total,
    });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can book hostels." }, { status: 403 });
    }

    const rl = await rateLimit(`booking:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.ok) return NextResponse.json({ error: "Too many booking attempts." }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const booking = await createBooking(session.user.id, parsed.data);

    return NextResponse.json(
      { data: booking, message: "Booking created." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
