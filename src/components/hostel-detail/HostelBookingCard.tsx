"use client";

import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import { useState, type FormEvent } from "react";
import { calculateMonths } from "@/lib/utils";
import { isStayWithinBounds } from "@/lib/hostel-date-selection";
import { DEFAULT_PAYMENT_METHOD } from "@/lib/payment-methods";
import { useHostelDateSelection } from "./HostelDateSelectionProvider";

interface BookableRoom {
  id: string;
  name: string;
  pricePerMonth: number;
  capacity: number;
  available: number;
}

interface HostelBookingCardProps {
  hostelId: string;
  minStay: number;
  maxStay: number | null;
  hasCancellationPolicy: boolean;
  rooms: BookableRoom[];
}

function readError(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return null;
}

function readBookingId(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("id" in value.data) ||
    typeof value.data.id !== "string"
  ) {
    return null;
  }

  return value.data.id;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PK").format(amount);
}

function todayDateInputValue(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function maxGuestsFor(room: BookableRoom | undefined): number {
  return room ? Math.min(4, room.capacity, room.available) : 0;
}

export function HostelBookingCard({
  hostelId,
  minStay,
  maxStay,
  hasCancellationPolicy,
  rooms,
}: HostelBookingCardProps) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const { checkIn, checkOut, setMoveIn, setMoveOut } =
    useHostelDateSelection();
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryBookingId, setRetryBookingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const room = rooms.find((candidate) => candidate.id === roomId);
  const stayMonths =
    checkIn && checkOut && checkOut > checkIn
      ? calculateMonths(
          new Date(`${checkIn}T00:00:00`),
          new Date(`${checkOut}T00:00:00`),
        )
      : 0;
  const stayIsValid = isStayWithinBounds(
    checkIn,
    checkOut,
    minStay,
    maxStay,
  );
  const estimatedTotal =
    room && stayIsValid ? room.pricePerMonth * stayMonths * guests : null;
  const canBook =
    Boolean(room) &&
    hasCancellationPolicy &&
    checkIn.length > 0 &&
    checkOut.length > 0 &&
    stayIsValid &&
    guests <= maxGuestsFor(room);

  async function startPayment(bookingId: string): Promise<boolean> {
    const response = await fetch("/api/payment/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const result: unknown = await response.json();

    if (!response.ok) {
      setMessage(readError(result) ?? "Could not start secure checkout. Please retry.");
      return false;
    }

    if (
      typeof result !== "object" ||
      result === null ||
      !("data" in result) ||
      typeof result.data !== "object" ||
      result.data === null ||
      !("paymentUrl" in result.data) ||
      typeof result.data.paymentUrl !== "string"
    ) {
      setMessage("The payment service returned an unexpected response. Please retry.");
      return false;
    }

    const paymentUrl = new URL(result.data.paymentUrl);
    if (paymentUrl.protocol !== "https:") {
      setMessage("The payment service returned an invalid checkout link.");
      return false;
    }

    window.location.assign(paymentUrl.toString());
    return true;
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setNeedsSignIn(false);

    if (!canBook || !room) {
      setMessage("Choose a room and valid stay dates before continuing.");
      return;
    }
    setIsSubmitting(true);
    let bookingId = retryBookingId;
    try {
      if (!bookingId) {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostelId,
            roomId,
            checkIn,
            checkOut,
            guests,
            paymentMethod: DEFAULT_PAYMENT_METHOD,
          }),
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          setNeedsSignIn(response.status === 401);
          setMessage(
            response.status === 401
              ? "Sign in as a student to continue with this booking."
              : readError(result) ?? "Could not create this booking. Please try again.",
          );
          return;
        }

        bookingId = readBookingId(result);
        if (!bookingId) {
          setMessage("The booking service returned an unexpected response.");
          return;
        }
        setRetryBookingId(bookingId);
      }

      if (await startPayment(bookingId)) return;
    } catch {
      setMessage(
        bookingId
          ? "Your booking is saved, but secure checkout could not start. Retry payment."
          : "Could not submit this booking. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <aside className="hostel-booking-card" aria-label="Reserve this hostel">
      <div className="hostel-booking-price">
        {room ? (
          <>
            <strong>PKR {formatPrice(room.pricePerMonth)}</strong>
            <span> / month</span>
          </>
        ) : (
          <strong>Monthly rate</strong>
        )}
      </div>
      {rooms.length > 0 ? (
        <form className="hostel-booking-form" onSubmit={submitBooking}>
          <label>
            <span>Room</span>
            <select
              onChange={(event) => {
                const nextRoom = rooms.find((candidate) => candidate.id === event.target.value);
                setRoomId(event.target.value);
                setGuests((current) => Math.min(current, maxGuestsFor(nextRoom) || 1));
              }}
              value={roomId}
            >
              {rooms.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} · PKR {formatPrice(candidate.pricePerMonth)} / month
                </option>
              ))}
            </select>
          </label>
          <div className="hostel-booking-dates">
            <label>
              <span>Move in</span>
              <input
                min={todayDateInputValue()}
                onChange={(event) => setMoveIn(event.target.value)}
                required
                type="date"
                value={checkIn}
              />
            </label>
            <label>
              <span>Move out</span>
              <input
                min={checkIn || todayDateInputValue()}
                onChange={(event) => setMoveOut(event.target.value)}
                required
                type="date"
                value={checkOut}
              />
            </label>
          </div>
          <label>
            <span>Guests</span>
            <select
              onChange={(event) => setGuests(Number(event.target.value))}
              value={guests}
            >
              {Array.from({ length: maxGuestsFor(room) }, (_, index) => index + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "guest" : "guests"}
                  </option>
                ),
              )}
            </select>
          </label>
          {checkIn && checkOut && !stayIsValid && (
            <p className="hostel-booking-hint" role="status">
              Stay must be {minStay}
              {maxStay === null ? " or more" : `–${maxStay}`} months.
            </p>
          )}
          {estimatedTotal !== null && (
            <p className="hostel-booking-total">
              Estimated total <strong>PKR {formatPrice(estimatedTotal)}</strong>
            </p>
          )}
          <button
            className="hostel-booking-submit"
            disabled={!canBook || isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Starting secure checkout…"
              : retryBookingId
                ? "Retry payment"
                : "Reserve"}
          </button>
          <p className="hostel-booking-payment-note">
            Secure card checkout starts before the host reviews your booking.
          </p>
          {!hasCancellationPolicy && (
            <p className="hostel-booking-hint" role="status">
              Booking is temporarily unavailable while cancellation terms are updated.
            </p>
          )}
          {message && (
            <p aria-live="polite" className="hostel-booking-message" role="alert">
              {message}
              {needsSignIn && (
                <>
                  {" "}
                  <LoginDialogTrigger>Sign in</LoginDialogTrigger>
                </>
              )}
            </p>
          )}
        </form>
      ) : (
        <p className="hostel-booking-hint" role="status">
          No rooms are currently available to book.
        </p>
      )}
    </aside>
  );
}
