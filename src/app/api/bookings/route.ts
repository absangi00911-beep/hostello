import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { bookingSchema } from "@/lib/validations";
import { calculateMonths } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import {
  bookingNotificationEmail,
  bookingConfirmationEmail,
} from "@/lib/email-templates/booking";
import { rateLimit, getIp } from "@/lib/rate-limit";

// Sentinel used to distinguish optimistic-lock conflicts from other errors
// inside a Prisma transaction (transactions swallow the original error type).
const ROOM_CONFLICT = "ROOM_CONFLICT" as const;

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`booking:${getIp(req)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to book a hostel." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { hostelId, roomId, checkIn, checkOut, guests, paymentMethod } =
      parsed.data;

    const hostel = await db.hostel.findUnique({
      where: { id: hostelId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        pricePerMonth: true,
        minStay: true,
        maxStay: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!hostel) {
      return NextResponse.json(
        { error: "Hostel not found or unavailable." },
        { status: 404 },
      );
    }

    const months = calculateMonths(checkIn, checkOut);

    if (months < hostel.minStay) {
      return NextResponse.json(
        { error: `Minimum stay is ${hostel.minStay} month(s).` },
        { status: 400 },
      );
    }
    if (hostel.maxStay && months > hostel.maxStay) {
      return NextResponse.json(
        { error: `Maximum stay is ${hostel.maxStay} months.` },
        { status: 400 },
      );
    }

    const total = months * hostel.pricePerMonth;

    const booking = await db.$transaction(async (tx) => {
      // Hostel-level bookings (roomId is null) — check for overlapping active bookings
      if (!roomId) {
        const overlap = await tx.booking.findFirst({
          where: {
            hostelId,
            userId: session.user.id,
            status: { in: ["PENDING", "CONFIRMED"] },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        });
        if (overlap) {
          throw new Error(
            "You already have an active booking for this hostel during this period."
          );
        }
      }

      if (roomId) {
        const room = await tx.room.findFirst({
          where: { id: roomId, hostelId, available: { gt: 0 } },
        });

        if (!room) throw new Error(ROOM_CONFLICT);

        try {
          await tx.room.update({
            where: { id: room.id, version: room.version }, // optimistic lock
            data: {
              available: { decrement: 1 },
              version: { increment: 1 },
            },
          });
        } catch (err) {
          // P2025 = "record not found" — the version no longer matches,
          // meaning another request updated this room between our findFirst
          // and this update. Map it to our sentinel so the outer catch can
          // return 409 rather than 500.
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            throw new Error(ROOM_CONFLICT);
          }
          throw err;
        }
      }

      return tx.booking.create({
        data: {
          hostelId,
          roomId: roomId ?? null,
          userId: session.user.id,
          checkIn,
          checkOut,
          months,
          guests,
          total,
          paymentMethod,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
        select: {
          id: true,
          hostelId: true,
          checkIn: true,
          checkOut: true,
          total: true,
          status: true,
          months: true,
        },
      });
    });

    const student = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (student) {
      const emailData = {
        studentName: student.name,
        studentEmail: student.email,
        ownerName: hostel.owner.name,
        ownerEmail: hostel.owner.email,
        hostelName: hostel.name,
        hostelSlug: hostel.slug,
        bookingId: booking.id,
        checkIn,
        checkOut,
        months,
        total,
        paymentMethod,
      };

      void Promise.all([
        sendEmail(bookingNotificationEmail(emailData)),
        sendEmail(bookingConfirmationEmail(emailData)),
      ]);
    }

    return NextResponse.json(
      { data: booking, message: "Booking request sent." },
      { status: 201 },
    );
  } catch (err) {
    // ── Optimistic-lock conflict → 409 Conflict ───────────────────────────
    if (err instanceof Error && err.message === ROOM_CONFLICT) {
      return NextResponse.json(
        {
          error:
            "This room was just booked by someone else. Refresh and try again.",
        },
        { status: 409 },
      );
    }

    // ── Double-booking check → 409 Conflict ────────────────────────────────
    if (
      err instanceof Error &&
      err.message.includes("already have an active booking")
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 },
      );
    }

    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await db.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImage: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({ data: bookings });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}