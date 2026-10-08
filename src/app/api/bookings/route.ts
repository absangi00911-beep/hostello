import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/bookings/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { BookingServiceError, createBooking } from "@/lib/booking-service";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination } from "@/lib/pagination";
import { readBoundedJson } from "@/lib/bounded-json";

const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const BOOKING_LIST_READS_PER_MINUTE = 60;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const hostelId = url.searchParams.get("hostelId");
    const { page, limit, skip } = parsePagination(url.searchParams, { defaultLimit: 20, maxLimit: 50 });

    if (url.search.length > 1_024 || (hostelId !== null && hostelId.length > 64)) {
      return NextResponse.json({ error: "Invalid booking filters." }, { status: 400 });
    }

    if (status && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const readLimit = await rateLimit(`booking-list:${session.user.id}`, {
      limit: BOOKING_LIST_READS_PER_MINUTE,
      windowMs: 60_000,
    });
    if (!readLimit.ok) {
      return NextResponse.json(
        { error: "Too many booking-list requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((readLimit.resetAt - Date.now()) / 1000))) },
        },
      );
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
        // Scope bookings through the owner relation instead of materializing
        // every hostel ID into an application-side IN list.
        where.hostel = { is: { ownerId: userId } };
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
    console.error("[GET /api/bookings]", getSafeErrorSummary(err));
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

    const body = await readBoundedJson(req, 2_048);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = bookingSchema.safeParse(body.data);
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
    console.error("[POST /api/bookings]", getSafeErrorSummary(err));
    if (err instanceof BookingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: "Could not create booking. Please try again." },
      { status: 500 },
    );
  }
}
