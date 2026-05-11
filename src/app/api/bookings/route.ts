import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { bookingSchema } from "@hostello/shared";
import { createBooking } from "@/lib/booking-service";
import { rateLimit } from "@/lib/rate-limit";

// ── Query param schema (owner / admin only) ────────────────────────────────
const ownerQuerySchema = z.object({
  hostelId: z.string().cuid().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    // ── STUDENT: existing behaviour, no params accepted ────────────────────
    if (role === "STUDENT") {
      const bookings = await db.booking.findMany({
        where:   { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          hostel: {
            select: {
              id: true, name: true, slug: true,
              coverImage: true, city: true,
            },
          },
        },
      });

      return NextResponse.json({ data: bookings });
    }

    // ── OWNER / ADMIN: scoped, paginated, filterable ───────────────────────
    const raw    = Object.fromEntries(new URL(req.url).searchParams);
    const parsed = ownerQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { hostelId, status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // Build the hostel-ownership scope.
    // OWNER: only hostels they own.
    // ADMIN: all hostels (no ownership filter).
    const hostelFilter: { ownerId?: string; id?: string } = {};

    if (role === "OWNER") {
      hostelFilter.ownerId = session.user.id;
    }

    // If the caller scoped to a specific hostel, verify ownership first.
    // This prevents an OWNER guessing another owner's hostelId to see
    // that hostel's bookings.
    if (hostelId) {
      if (role === "OWNER") {
        const owned = await db.hostel.findUnique({
          where:  { id: hostelId },
          select: { ownerId: true },
        });

        if (!owned || owned.ownerId !== session.user.id) {
          return NextResponse.json(
            { error: "Hostel not found or not owned by you." },
            { status: 404 },
          );
        }
      }
      hostelFilter.id = hostelId;
    }

    // Find matching hostel IDs (used to scope bookings without a JOIN
    // that could leak hostel data into the booking rows).
    const hostels = await db.hostel.findMany({
      where:  hostelFilter,
      select: { id: true },
    });

    const hostelIds = hostels.map((h) => h.id);

    // If owner has no hostels yet, return empty rather than querying everything.
    if (role === "OWNER" && hostelIds.length === 0) {
      return NextResponse.json({
        data:    [],
        total:   0,
        page,
        limit,
        hasMore: false,
      });
    }

    const whereClause = {
      ...(hostelIds.length > 0 && { hostelId: { in: hostelIds } }),
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where:   whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take:    limit,
        include: {
          hostel: {
            select: {
              id: true, name: true, slug: true,
              coverImage: true, city: true,
            },
          },
          // Owners need to know who booked and how to contact them.
          // Students do not see this block (they're handled above).
          user: {
            select: {
              id: true, name: true, email: true,
              // Phone only returned to owner — needed for move-in coordination.
              // Never returned to admins scraping user data.
              ...(role === "OWNER" && { phone: true }),
            },
          },
        },
      }),
      db.booking.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data:    bookings,
      total,
      page,
      limit,
      hasMore: skip + bookings.length < total,
    });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 10 booking attempts per user per hour
    const rl = await rateLimit(`booking-create:${session.user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const booking = await createBooking(session.user.id, parsed.data);

    return NextResponse.json({
      data: booking,
      message: "Booking request sent successfully.",
    }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/bookings]", err);
    
    // Distinguish between business logic errors and internal errors
    const isKnownError = [
      "Hostel not found",
      "Selected room not found",
      "Not enough capacity",
      "Room became full",
    ].some(msg => err.message?.includes(msg));

    return NextResponse.json(
      { error: isKnownError ? err.message : "Failed to create booking request." },
      { status: isKnownError ? 400 : 500 }
    );
  }
}
