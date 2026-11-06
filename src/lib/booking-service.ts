import { db } from "@/lib/db";
import type { PrismaClient } from "@/generated/client";
import { calculateMonths } from "@/lib/utils";
import {
  getPakistanCalendarDate,
  isEnabledPaymentMethod,
  type BookingInput,
} from "@hostello/shared";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent } from "@/lib/operational-logger";
import {
  createSeatHolds,
  getRoomStayAvailability,
  lockHostelInventory,
} from "@/lib/room-availability-service";
import { reevaluateAvailabilityAlertsForHostel } from "@/lib/availability-alerts";

export class BookingServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 404 | 409,
  ) {
    super(message);
    this.name = "BookingServiceError";
  }
}

type BookingDatabase = Pick<PrismaClient, "$transaction">;

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return getErrorCode(error.cause);
  return undefined;
}

function isSeatHoldConflict(error: unknown) {
  return ["23P01", "P2002", "P2004", "P2034"].includes(getErrorCode(error) ?? "");
}

function isDateOnly(date: Date) {
  return Number.isFinite(date.getTime()) &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
}

function validateBookingInput(input: BookingInput) {
  if (!isEnabledPaymentMethod(input.paymentMethod)) {
    throw new BookingServiceError("Payment method is not available.", 409);
  }
  if (!input.roomId) {
    throw new BookingServiceError("Select a room before submitting this booking.", 409);
  }
  if (
    !isDateOnly(input.checkIn) ||
    !isDateOnly(input.checkOut) ||
    input.checkIn < getPakistanCalendarDate() ||
    input.checkOut <= input.checkIn
  ) {
    throw new BookingServiceError("Select a valid future stay with check-out after check-in.", 409);
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 4) {
    throw new BookingServiceError("The guest count is invalid.", 409);
  }
}

export async function createBooking(
  userId: string,
  input: BookingInput,
  database: BookingDatabase = db,
) {
  validateBookingInput(input);

  try {
    const booking = await database.$transaction(async (tx) => {
      if (!await lockHostelInventory(tx, input.hostelId)) {
        throw new BookingServiceError("Hostel not found or not available for booking.", 404);
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { deletionRequestedAt: true },
      });
      if (!user || user.deletionRequestedAt) {
        throw new BookingServiceError("Account deletion is being processed.", 409);
      }

      const hostel = await tx.hostel.findUnique({
        where: { id: input.hostelId },
        select: {
          id: true,
          name: true,
          ownerId: true,
          status: true,
          pricePerMonth: true,
          cancellationPolicy: true,
        },
      });
      if (!hostel || hostel.status !== "ACTIVE") {
        throw new BookingServiceError("Hostel not found or not available for booking.", 404);
      }
      if (!hostel.cancellationPolicy) {
        throw new BookingServiceError(
          "This hostel is updating its cancellation terms and is temporarily unavailable for booking.",
          409,
        );
      }

      const room = await tx.room.findFirst({
        where: { id: input.roomId, hostelId: input.hostelId },
        select: { id: true, hostelId: true, capacity: true, pricePerMonth: true },
      });
      if (!room) {
        throw new BookingServiceError("Selected room not found.", 404);
      }

      const availability = await getRoomStayAvailability(tx, {
        hostelId: input.hostelId,
        roomId: room.id,
        capacity: room.capacity,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
      });
      if (availability.blocked) {
        throw new BookingServiceError(
          "The selected room is blocked for one or more dates in this stay.",
          409,
        );
      }
      if (!availability.fits) {
        throw new BookingServiceError(
          "The selected room no longer has enough seats for these dates. Choose another room or stay.",
          409,
        );
      }

      const months = calculateMonths(input.checkIn, input.checkOut);
      const total = room.pricePerMonth * months * input.guests;
      const booking = await tx.booking.create({
        data: {
          userId,
          hostelId: input.hostelId,
          roomId: room.id,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          months,
          guests: input.guests,
          total,
          cancellationPolicy: hostel.cancellationPolicy,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
        },
        include: {
          hostel: { select: { name: true, ownerId: true } },
          user: { select: { name: true } },
        },
      });

      await createSeatHolds(tx, {
        bookingId: booking.id,
        roomId: room.id,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        seatNumbers: availability.availableSeatNumbers.slice(0, input.guests),
      });

      return booking;
    }, { isolationLevel: "ReadCommitted" });
    try {
      await reevaluateAvailabilityAlertsForHostel(input.hostelId);
    } catch (error) {
      const summary = getSafeErrorSummary(error);
      logOperationalEvent("error", "booking.availability_alerts.reevaluation_failed", {
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
        ...(summary.status ? { error_status: summary.status } : {}),
      });
    }
    return booking;
  } catch (error) {
    if (error instanceof BookingServiceError) throw error;
    if (isSeatHoldConflict(error)) {
      throw new BookingServiceError(
        "Room availability changed while you were booking. Please choose another room or dates.",
        409,
      );
    }
    throw error;
  }
}
