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
    <aside
      aria-label="Reserve this hostel"
      className="sticky top-6 col-[2] row-[1] rounded-[10px] border border-line bg-white p-[18px] shadow-[0_2px_8px_rgb(29_42_34_/_8%)] [@media(max-width:900px)]:static [@media(max-width:900px)]:col-[1] [@media(max-width:900px)]:row-[2]"
    >
      <div className="mb-3 text-[0.78rem] text-muted">
        {room ? (
          <>
            <strong className="text-[1.2rem] leading-[1.18] font-bold tracking-[-0.02em] text-ink tabular-nums [font-family:var(--font-inter),_sans-serif]">
              PKR {formatPrice(room.pricePerMonth)}
            </strong>
            <span> / month</span>
          </>
        ) : (
          <strong className="text-[1.2rem] leading-[1.18] font-bold tracking-[-0.02em] text-ink tabular-nums [font-family:var(--font-inter),_sans-serif]">
            Monthly rate
          </strong>
        )}
      </div>
      {rooms.length > 0 ? (
        <form
          className="grid gap-[9px]"
          onSubmit={submitBooking}
        >
          <label className="grid min-w-0 gap-1">
            <span className="text-[0.68rem] font-[650] text-ink">Room</span>
            <select
              className="min-h-10 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.76rem] text-ink focus-visible:outline-brand"
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
          <div className="grid grid-cols-2 gap-[10px]">
            <label className="grid min-w-0 gap-1">
              <span className="text-[0.68rem] font-[650] text-ink">
                Move in
              </span>
              <input
                className="min-h-10 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.76rem] text-ink focus-visible:outline-brand"
                min={todayDateInputValue()}
                onChange={(event) => setMoveIn(event.target.value)}
                required
                type="date"
                value={checkIn}
              />
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-[0.68rem] font-[650] text-ink">
                Move out
              </span>
              <input
                className="min-h-10 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.76rem] text-ink focus-visible:outline-brand"
                min={checkIn || todayDateInputValue()}
                onChange={(event) => setMoveOut(event.target.value)}
                required
                type="date"
                value={checkOut}
              />
            </label>
          </div>
          <label className="grid min-w-0 gap-1">
            <span className="text-[0.68rem] font-[650] text-ink">Guests</span>
            <select
              className="min-h-10 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.76rem] text-ink focus-visible:outline-brand"
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
            <p
              className="m-0 text-[0.7rem] leading-[1.5] text-[#8b2525]"
              role="status"
            >
              Stay must be {minStay}
              {maxStay === null ? " or more" : `–${maxStay}`} months.
            </p>
          )}
          {estimatedTotal !== null && (
            <p className="mx-0 my-1 flex justify-between gap-3 border-t border-line pt-3 text-[0.82rem] text-muted">
              Estimated total{" "}
              <strong className="text-[0.875rem] leading-[1.43] font-semibold text-ink tabular-nums [font-family:var(--font-inter),_sans-serif]">
                PKR {formatPrice(estimatedTotal)}
              </strong>
            </p>
          )}
          <button
            className="min-h-11 cursor-pointer rounded-lg border-0 bg-brand text-[0.84rem] font-[650] text-white hover:enabled:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canBook || isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Starting secure checkout…"
              : retryBookingId
                ? "Retry payment"
                : "Reserve"}
          </button>
          <p className="m-0 text-[0.7rem] leading-[1.5] text-muted">
            Secure card checkout starts before the host reviews your booking.
          </p>
          {!hasCancellationPolicy && (
            <p
              className="m-0 text-[0.7rem] leading-[1.5] text-[#8b2525]"
              role="status"
            >
              Booking is temporarily unavailable while cancellation terms are updated.
            </p>
          )}
          {message && (
            <p
              aria-live="polite"
              className="m-0 text-[0.7rem] leading-[1.5] text-[#8b2525]"
              role="alert"
            >
              {message}
              {needsSignIn && (
                <>
                  {" "}
                  <LoginDialogTrigger className="font-[650] text-brand-dark underline underline-offset-[3px]">
                    Sign in
                  </LoginDialogTrigger>
                </>
              )}
            </p>
          )}
        </form>
      ) : (
        <p
          className="m-0 text-[0.7rem] leading-[1.5] text-[#8b2525]"
          role="status"
        >
          No rooms are currently available to book.
        </p>
      )}
    </aside>
  );
}
