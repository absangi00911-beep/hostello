import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { bookingSchema } from "@/lib/validations";
import { calculateMonths } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { bookingNotificationEmail, bookingConfirmationEmail } from "@/lib/email-templates/booking";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 10 booking requests per user IP per hour
  const rl = await rateLimit(`booking:${getIp(req)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Sign in to book a hostel." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { hostelId, roomId, checkIn, checkOut, guests, paymentMethod } = parsed.data;

    // Fetch hostel + owner in one query so we have everything for the emails
    const hostel = await db.hostel.findUnique({
      where: { id: hostelId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        pricePerMonth: true,
        minStay: true,
        maxStay: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found or unavailable." }, { status: 404 });
    }

    const months = calculateMonths(checkIn, checkOut);

    if (months < hostel.minStay) {
      return NextResponse.json(
        { error: `Minimum stay is ${hostel.minStay} month(s).` },
        { status: 400 }
      );
    }
    if (hostel.maxStay && months > hostel.maxStay) {
      return NextResponse.json(
        { error: `Maximum stay is ${hostel.maxStay} months.` },
        { status: 400 }
      );
    }

    const total = months * hostel.pricePerMonth;

    const booking = await db.booking.create({
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

    // Build email data — we need the student's name and email from the session
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

      // Send both emails in parallel — fire and forget.
      // A failed email never fails the booking.
      void Promise.all([
        sendEmail(bookingNotificationEmail(emailData)),  // → owner
        sendEmail(bookingConfirmationEmail(emailData)),  // → student
      ]);
    }

    return NextResponse.json(
      { data: booking, message: "Booking request sent." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
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
          select: { id: true, name: true, slug: true, coverImage: true, city: true },
        },
      },
    });

    return NextResponse.json({ data: bookings });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
