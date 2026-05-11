import { db } from "@/lib/db";
import { calculateMonths } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import type { BookingInput } from "@hostello/shared";

/**
 * Service to handle booking operations.
 * 
 * Concurrency Strategy:
 * - Uses optimistic locking on Room.version.
 * - Uses a transaction to ensure atomicity.
 * - Validates availability before and during the update.
 */
export async function createBooking(userId: string, input: BookingInput) {
  const { hostelId, roomId, checkIn, checkOut, guests, paymentMethod } = input;

  // 1. Fetch hostel and optional room
  const hostel = await db.hostel.findUnique({
    where: { id: hostelId },
    select: { id: true, name: true, ownerId: true, status: true, pricePerMonth: true, capacity: true },
  });

  if (!hostel || hostel.status !== "ACTIVE") {
    throw new Error("Hostel not found or not available for booking.");
  }

  let pricePerMonth = hostel.pricePerMonth;
  let targetRoom = null;

  if (roomId) {
    targetRoom = await db.room.findUnique({
      where: { id: roomId, hostelId },
    });

    if (!targetRoom) {
      throw new Error("Selected room not found.");
    }
    
    if (targetRoom.available < guests) {
      throw new Error("Not enough capacity in the selected room.");
    }

    pricePerMonth = targetRoom.pricePerMonth;
  }

  // 2. Calculate totals
  const months = calculateMonths(new Date(checkIn), new Date(checkOut));
  const total = pricePerMonth * months * guests;

  // 3. Atomic transaction with optimistic locking
  return await db.$transaction(async (tx) => {
    // If a specific room was selected, decrement availability with optimistic lock
    if (roomId && targetRoom) {
      const updatedRoom = await tx.room.update({
        where: { 
          id: roomId,
          version: targetRoom.version // Optimistic lock
        },
        data: {
          available: { decrement: guests },
          version: { increment: 1 }
        }
      });

      if (updatedRoom.available < 0) {
        throw new Error("Room became full during booking. Please try again.");
      }
    }

    // Create the booking record
    const booking = await tx.booking.create({
      data: {
        userId,
        hostelId,
        roomId: roomId || null,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        months,
        guests,
        total,
        paymentMethod,
        paymentStatus: "PENDING",
        status: "PENDING",
      },
      include: {
        hostel: { select: { name: true, ownerId: true } },
        user: { select: { name: true } },
      }
    });

    // 4. Notify the owner
    // Fire-and-forget: failure to notify shouldn't roll back the booking.
    void createNotification({
      userId: hostel.ownerId,
      type: "BOOKING_REQUEST",
      title: "New Booking Request",
      message: `${booking.user.name} has requested a booking for ${hostel.name}.`,
      bookingId: booking.id,
      hostelId: hostel.id,
    });

    return booking;
  });
}
