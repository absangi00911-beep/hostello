import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        hostel: {
          select: {
            id: true, name: true, slug: true,
            coverImage: true, city: true, area: true, address: true,
            ownerId: true,
            owner: { select: { name: true, phone: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isStudent = booking.userId === session.user.id;
    const isOwner   = booking.hostel.ownerId === session.user.id;
    const isAdmin   = session.user.role === "ADMIN";

    if (!isStudent && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ data: booking, viewAs: isOwner && !isStudent ? "owner" : "student" });
  } catch (err) {
    console.error("[GET /api/bookings/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body   = await req.json();
    const action = body?.action as string | undefined;

    if (!action || !["cancel", "confirm", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        hostel: { select: { ownerId: true, name: true, slug: true } },
        user:   { select: { name: true, email: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isStudent     = booking.userId === session.user.id;
    const isHostelOwner = booking.hostel.ownerId === session.user.id;
    const isAdmin       = session.user.role === "ADMIN";

    // ── Cancel (student or admin only) ────────────────────────────────────────
    if (action === "cancel") {
      if (!isStudent && !isAdmin) {
        return NextResponse.json({ error: "Only the student can cancel." }, { status: 403 });
      }
      if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
        return NextResponse.json({ error: "Booking cannot be cancelled." }, { status: 400 });
      }

      // Use a transaction to atomically cancel the booking and restore room availability
      const updated = await db.$transaction(async (tx) => {
        const cancelled = await tx.booking.update({
          where: { id },
          data: { status: "CANCELLED" },
          select: { id: true, status: true, roomId: true },
        });

        // Restore room availability if a specific room was booked
        if (cancelled.roomId) {
          await tx.room.update({
            where: { id: cancelled.roomId },
            data: {
              available: { increment: 1 },
              version: { increment: 1 },
            },
          });
        }

        return cancelled;
      });

      return NextResponse.json({ data: updated, message: "Booking cancelled." });
    }

    // ── Confirm / Decline (hostel owner or admin only) ─────────────────────────
    if (!isHostelOwner && !isAdmin) {
      return NextResponse.json({ error: "Only the hostel owner can do this." }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Booking is already ${booking.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    const newStatus = action === "confirm" ? "CONFIRMED" : "CANCELLED";

    // Use a transaction so decline also restores room availability atomically
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: { status: newStatus },
        select: { id: true, status: true, roomId: true },
      });

      // Restore room availability when owner declines
      if (newStatus === "CANCELLED" && result.roomId) {
        await tx.room.update({
          where: { id: result.roomId },
          data: {
            available: { increment: 1 },
            version: { increment: 1 },
          },
        });
      }

      return result;
    });

    // Notify student by email — fire and forget
    sendEmail(
      bookingStatusEmail({
        studentName:  booking.user.name,
        studentEmail: booking.user.email,
        hostelName:   booking.hostel.name,
        hostelSlug:   booking.hostel.slug,
        bookingId:    booking.id,
        status:       newStatus,
      })
    ).catch(() => {
      // Silently ignore email failures
    });

    return NextResponse.json({
      data: updated,
      message: action === "confirm" ? "Booking confirmed." : "Booking declined.",
    });
  } catch (err) {
    console.error("[PATCH /api/bookings/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}