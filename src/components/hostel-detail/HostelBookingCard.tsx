"use client";

import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getPakistanCalendarDate, MAX_BOOKING_MONTHS } from "@hostello/shared";
import {
  areStayBoundsValid,
  getWholeMonthTerm,
  isStayWithinBounds,
} from "@/lib/hostel-date-selection";
import { buildHostelAvailabilityAlertHref } from "@/lib/availability-alert-links";
import { DEFAULT_PAYMENT_METHOD } from "@/lib/payment-methods";
import { useHostelDateSelection } from "./HostelDateSelectionProvider";

interface BookableRoom {
  id: string;
  name: string;
  pricePerMonth: number;
  capacity: number;
}

interface HostelBookingCardProps {
  hostelId: string;
  minStay: number;
  maxStay: number | null;
  hasCancellationPolicy: boolean;
  rooms: BookableRoom[];
}

export interface ExactRoomAvailability {
  roomId: string;
  capacity: number;
  availableSeats: number;
  fits: boolean;
}

export function buildExactAvailabilityUrl(
  hostelSlug: string,
  checkIn: string,
  checkOut: string,
  guests: number,
): string | null {
  if (!isStayWithinBounds(checkIn, checkOut, 1, null)) return null;
  const query = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(guests),
  });
  return `/api/hostels/${encodeURIComponent(hostelSlug)}/availability/exact?${query}`;
}

export function parseExactAvailability(
  value: unknown,
): ExactRoomAvailability[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    !Array.isArray(value.data)
  ) {
    return null;
  }

  const rooms: ExactRoomAvailability[] = [];
  for (const room of value.data) {
    if (
      typeof room !== "object" ||
      room === null ||
      !("roomId" in room) ||
      typeof room.roomId !== "string" ||
      !("capacity" in room) ||
      typeof room.capacity !== "number" ||
      !Number.isSafeInteger(room.capacity) ||
      !("availableSeats" in room) ||
      typeof room.availableSeats !== "number" ||
      !Number.isSafeInteger(room.availableSeats) ||
      !("fits" in room) ||
      typeof room.fits !== "boolean" ||
      room.capacity < 0 ||
      room.availableSeats < 0 ||
      room.availableSeats > room.capacity
    ) {
      return null;
    }

    rooms.push({
      roomId: room.roomId,
      capacity: room.capacity,
      availableSeats: room.availableSeats,
      fits: room.fits,
    });
  }

  return rooms;
}

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED";

interface ConfirmedBookingOutcome {
  id: string;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

export function parseBookingOutcome(
  value: unknown,
): ConfirmedBookingOutcome | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null
  ) {
    return null;
  }

  const booking = value.data;
  const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  const paymentStatuses: PaymentStatus[] = [
    "PENDING",
    "PAID",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
    "FAILED",
  ];
  if (
    !("id" in booking) ||
    typeof booking.id !== "string" ||
    !("total" in booking) ||
    typeof booking.total !== "number" ||
    !Number.isFinite(booking.total) ||
    !("status" in booking) ||
    typeof booking.status !== "string" ||
    !statuses.includes(booking.status as BookingStatus) ||
    !("paymentStatus" in booking) ||
    typeof booking.paymentStatus !== "string" ||
    !paymentStatuses.includes(booking.paymentStatus as PaymentStatus)
  ) {
    return null;
  }

  return {
    id: booking.id,
    total: booking.total,
    status: booking.status as BookingStatus,
    paymentStatus: booking.paymentStatus as PaymentStatus,
  };
}

const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Payment received",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

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

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PK").format(amount);
}

function todayDateInputValue(): string {
  return getPakistanCalendarDate().toISOString().slice(0, 10);
}

function formatDateOnlyForDisplay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function maxGuestsFor(room: BookableRoom | undefined): number {
  return room ? Math.min(4, room.capacity) : 0;
}

export function HostelBookingCard({
  hostelId,
  minStay,
  maxStay,
  hasCancellationPolicy,
  rooms,
}: HostelBookingCardProps) {
  const bookingCardRef = useRef<HTMLElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const roomSelectRef = useRef<HTMLSelectElement>(null);
  const [roomId, setRoomId] = useState("");
  const { checkIn, checkOut, setMoveIn, setMoveOut } =
    useHostelDateSelection();
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [availability, setAvailability] = useState<ExactRoomAvailability[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [bookingOutcome, setBookingOutcome] =
    useState<ConfirmedBookingOutcome | null>(null);
  const [submissionUncertain, setSubmissionUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const room = rooms.find((candidate) => candidate.id === roomId);
  const selectedAvailability =
    availability?.find((candidate) => candidate.roomId === roomId) ?? null;
  const stayTerm = getWholeMonthTerm(checkIn, checkOut);
  const stayMonths = stayTerm?.months ?? 0;
  const stayBoundsAreValid = areStayBoundsValid(minStay, maxStay);
  const stayIsValid =
    stayBoundsAreValid &&
    checkIn >= todayDateInputValue() &&
    isStayWithinBounds(checkIn, checkOut, minStay, maxStay);
  const estimatedTotal =
    room && stayIsValid ? room.pricePerMonth * stayMonths * guests : null;
  const canBook =
    Boolean(room) &&
    hasCancellationPolicy &&
    checkIn.length > 0 &&
    checkOut.length > 0 &&
    stayIsValid &&
    guests <= maxGuestsFor(room) &&
    Boolean(selectedAvailability?.fits) &&
    !availabilityLoading &&
    !bookingOutcome &&
    !submissionUncertain;
  const quickReserveLabel = bookingOutcome
    ? "Booking status"
    : submissionUncertain
      ? "Check booking status"
      : !hasCancellationPolicy
    ? "Unavailable"
      : !room
        ? "Choose a room"
      : availabilityLoading && checkIn && checkOut
        ? "Checking availability…"
        : canBook
          ? showReview
            ? "Request booking"
            : "Review booking"
      : checkIn && checkOut
          ? "Choose another room"
          : "Choose dates";
  const availabilityAlertHref = buildHostelAvailabilityAlertHref({
    hostelId,
    checkIn,
    checkOut,
    guests,
  });

  useEffect(() => {
    if (bookingOutcome || !stayIsValid) {
      setAvailabilityLoading(false);
      setAvailability(null);
      setAvailabilityError("");
      return;
    }

    const availabilityUrl = buildExactAvailabilityUrl(
      hostelId,
      checkIn,
      checkOut,
      guests,
    );
    if (!availabilityUrl) {
      setAvailabilityLoading(false);
      setAvailability(null);
      setAvailabilityError("");
      return;
    }

    const controller = new AbortController();
    setAvailability(null);
    setAvailabilityLoading(true);
    setAvailabilityError("");

    async function loadAvailability(url: string) {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const result: unknown = await response.json();
        if (!response.ok) {
          setAvailabilityError(
            readError(result) ?? "Could not check room availability. Try again.",
          );
          return;
        }

        const parsed = parseExactAvailability(result);
        if (!parsed) {
          setAvailabilityError("Could not confirm room availability. Try again.");
          return;
        }
        setAvailability(parsed);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setAvailabilityError("Could not check room availability. Try again.");
      } finally {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      }
    }

    void loadAvailability(availabilityUrl);
    return () => controller.abort();
  }, [
    hostelId,
    checkIn,
    checkOut,
    guests,
    availabilityRefresh,
    bookingOutcome,
    stayIsValid,
  ]);

  function handleQuickReserve() {
    if (canBook) return;

    bookingCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    (room ? moveInInputRef.current : roomSelectRef.current)?.focus({
      preventScroll: true,
    });
  }

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

    if (!showReview) {
      if (!canBook || !room) {
        setMessage("Choose an available room and valid stay dates before continuing.");
        return;
      }
      setShowReview(true);
      return;
    }

    if (!canBook || !room) {
      setMessage("Choose a room and valid stay dates before continuing.");
      return;
    }
    setIsSubmitting(true);
    try {
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
        if (response.status === 409) {
          setRoomId("");
          setShowReview(false);
          setAvailabilityRefresh((current) => current + 1);
          setMessage(
            "This room is no longer available for those dates. Change dates or choose another room.",
          );
        } else {
          setMessage(
            response.status === 401
              ? "Sign in as a student to continue with this booking."
              : readError(result) ?? "Could not create this booking. Please try again.",
          );
        }
        return;
      }

      const booking = parseBookingOutcome(result);
      if (!booking) {
        setSubmissionUncertain(true);
        setMessage(
          "We couldn't confirm the request status. Check Trips before trying again.",
        );
        return;
      }
      setBookingOutcome(booking);
      setShowReview(false);
    } catch {
      setSubmissionUncertain(true);
      setMessage(
        "We couldn't confirm the request status. Check Trips before trying again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartPayment() {
    if (
      !bookingOutcome ||
      bookingOutcome.status !== "PENDING" ||
      !["PENDING", "FAILED"].includes(bookingOutcome.paymentStatus)
    ) {
      return;
    }

    setIsStartingPayment(true);
    setMessage("");
    try {
      await startPayment(bookingOutcome.id);
    } catch {
      setMessage("Could not start secure checkout. Check booking status before retrying.");
    } finally {
      setIsStartingPayment(false);
    }
  }

  function changeBookingDetails() {
    setShowReview(false);
    setMessage("");
  }
  return (
    <aside
      aria-label="Reserve this hostel"
      className="hostel-booking-card sticky top-6 col-[2] row-[1] rounded-[10px] border border-line bg-white p-[18px] shadow-[0_2px_8px_rgb(29_42_34_/_8%)] [@media(max-width:900px)]:static [@media(max-width:900px)]:col-[1] [@media(min-width:721px)_and_(max-width:900px)]:row-[4] [@media(max-width:720px)]:row-[2] [@media(max-width:720px)]:rounded-none [@media(max-width:720px)]:border-0 [@media(max-width:720px)]:bg-transparent [@media(max-width:720px)]:p-5 [@media(max-width:720px)]:shadow-none"
      id="hostel-booking"
      ref={bookingCardRef}
    >
      <div className="mb-3 text-[0.8125rem] text-muted">
        {room ? (
          <>
            <strong className="text-xl leading-[1.18] font-bold tracking-[-0.02em] text-ink tabular-nums [font-family:var(--font-inter),_sans-serif]">
              PKR {formatPrice(room.pricePerMonth)}
            </strong>
            <span> / month</span>
          </>
        ) : (
          <strong className="text-xl leading-[1.18] font-bold tracking-[-0.02em] text-ink tabular-nums [font-family:var(--font-inter),_sans-serif]">
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
            <span className="text-[0.8125rem] font-[650] text-ink">Room</span>
            <select
              className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.8125rem] text-ink focus-visible:outline-brand"
              disabled={Boolean(bookingOutcome) || submissionUncertain || showReview}
              ref={roomSelectRef}
              onChange={(event) => {
                const nextRoom = rooms.find((candidate) => candidate.id === event.target.value);
                setRoomId(event.target.value);
                setGuests((current) => Math.min(current, maxGuestsFor(nextRoom) || 1));
                setShowReview(false);
                setMessage("");
              }}
              value={roomId}
            >
              <option disabled value="">
                Choose a room
              </option>
              {rooms.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} · PKR {formatPrice(candidate.pricePerMonth)} / month
                  {availability
                    ? ` · ${availability.find((item) => item.roomId === candidate.id)?.availableSeats ?? 0} of ${candidate.capacity} seats`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-[10px]">
            <label className="grid min-w-0 gap-1">
              <span className="text-[0.8125rem] font-[650] text-ink">
                Move in
              </span>
              <input
                className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.8125rem] text-ink focus-visible:outline-brand"
                disabled={Boolean(bookingOutcome) || submissionUncertain || showReview}
                ref={moveInInputRef}
                min={todayDateInputValue()}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  if (checkOut && !isStayWithinBounds(nextCheckIn, checkOut, minStay, maxStay)) {
                    setMoveOut("");
                  }
                  setMoveIn(nextCheckIn);
                  setShowReview(false);
                  setMessage("");
                }}
                required
                type="date"
                value={checkIn}
              />
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-[0.8125rem] font-[650] text-ink">
                Move out
              </span>
              <input
                className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.8125rem] text-ink focus-visible:outline-brand"
                disabled={Boolean(bookingOutcome) || submissionUncertain || showReview}
                min={checkIn || todayDateInputValue()}
                onChange={(event) => {
                  const nextCheckOut = event.target.value;
                  if (
                    !isStayWithinBounds(checkIn, nextCheckOut, minStay, maxStay) ||
                    checkIn < todayDateInputValue()
                  ) {
                    setMessage(
                      `Move-out must match a whole-month term within this listing's ${minStay} to ${Math.min(maxStay ?? MAX_BOOKING_MONTHS, MAX_BOOKING_MONTHS)} month stay limits and the ${MAX_BOOKING_MONTHS}-month global maximum. Choose an eligible date from the calendar.`,
                    );
                    return;
                  }
                  setMoveOut(nextCheckOut);
                  setShowReview(false);
                  setMessage("");
                }}
                required
                type="date"
                value={checkOut}
              />
            </label>
          </div>
          <label className="grid min-w-0 gap-1">
            <span className="text-[0.8125rem] font-[650] text-ink">Guests</span>
            <select
              className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-[9px] py-[7px] text-[0.8125rem] text-ink focus-visible:outline-brand"
              disabled={Boolean(bookingOutcome) || submissionUncertain || showReview}
              onChange={(event) => {
                setGuests(Number(event.target.value));
                setShowReview(false);
                setMessage("");
              }}
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
          {availabilityLoading && (
            <p className="m-0 text-[0.8125rem] text-muted" role="status">
              Checking exact availability for these dates…
            </p>
          )}
          {availabilityError && (
            <p className="m-0 text-[0.8125rem] text-[#991b1b]" role="alert">
              {availabilityError}
              {" "}
              <button
                className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-semibold text-brand-dark underline underline-offset-2"
                onClick={() => setAvailabilityRefresh((current) => current + 1)}
                type="button"
              >
                Try again
              </button>
            </p>
          )}
          {!availabilityLoading &&
            !availabilityError &&
            checkIn &&
            checkOut &&
            selectedAvailability && (
              <p className="m-0 text-[0.8125rem] text-muted" role="status">
                {selectedAvailability.fits
                  ? `Available for all selected dates: ${selectedAvailability.availableSeats} of ${selectedAvailability.capacity} seats.`
                  : "No room seats are available for the selected dates and guest count. Change dates or choose another room."}
              </p>
            )}
          {!stayBoundsAreValid && (
            <p className="m-0 text-[0.8125rem] leading-[1.5] text-[#8b2525]" role="alert">
              This listing's stay requirements are invalid, so booking is unavailable.
            </p>
          )}
          {checkIn && checkOut && stayIsValid && stayTerm && (
            <p className="m-0 text-[0.8125rem] leading-[1.5] text-muted" aria-live="polite" role="status">
              Selected term: {stayTerm.months} {stayTerm.months === 1 ? "month" : "months"}.
              {stayTerm.isMonthEndClamped && (
                <> Move-out is clamped to {formatDateOnlyForDisplay(checkOut)} because the target month has fewer days than your move-in date.</>
              )}
            </p>
          )}
          {checkIn && checkOut && !stayIsValid && stayBoundsAreValid && (
            <p
              className="m-0 text-[0.8125rem] leading-[1.5] text-[#8b2525]"
              role="status"
            >
              Stay must be a whole-month term from {minStay} to {Math.min(maxStay ?? MAX_BOOKING_MONTHS, MAX_BOOKING_MONTHS)} months (global maximum: {MAX_BOOKING_MONTHS} months).
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
          {showReview && room && (
            <section
              aria-labelledby="booking-review-title"
              className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3 text-[0.82rem]"
            >
              <h3 className="m-0 text-sm font-semibold" id="booking-review-title">
                Review your booking
              </h3>
              <p className="m-0">Room: {room.name}</p>
              <p className="m-0">Move in: {checkIn}</p>
              <p className="m-0">Move out: {checkOut} (checkout day is not an occupied night)</p>
              <p className="m-0">{guests} {guests === 1 ? "guest" : "guests"}</p>
              {estimatedTotal !== null && (
                <p className="m-0 font-semibold">
                  Estimated total: PKR {formatPrice(estimatedTotal)}
                </p>
              )}
              <button
                className="min-h-11 cursor-pointer rounded-lg border border-line bg-white px-3 font-semibold text-ink"
                onClick={changeBookingDetails}
                type="button"
              >
                Change details
              </button>
            </section>
          )}
          {bookingOutcome && (
            <section
              aria-label="Booking request status"
              className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3 text-[0.82rem]"
              role="status"
            >
              <p className="m-0 font-semibold">Booking request received</p>
              <p className="m-0">Booking status: {bookingStatusLabels[bookingOutcome.status]}</p>
              <p className="m-0">Payment status: {paymentStatusLabels[bookingOutcome.paymentStatus]}</p>
              <p className="m-0">Total: PKR {formatPrice(bookingOutcome.total)}</p>
              <a
                className="inline-flex min-h-11 items-center text-brand-dark underline underline-offset-2"
                href={`/bookings/${encodeURIComponent(bookingOutcome.id)}`}
              >
                View booking
              </a>
              {bookingOutcome.status === "PENDING" &&
                ["PENDING", "FAILED"].includes(bookingOutcome.paymentStatus) && (
                  <button
                    className="min-h-11 cursor-pointer rounded-lg border-0 bg-brand px-3 font-semibold text-white hover:bg-brand-dark"
                    disabled={isStartingPayment}
                    onClick={() => void handleStartPayment()}
                    type="button"
                  >
                    {isStartingPayment ? "Starting secure checkout…" : "Continue to Safepay"}
                  </button>
                )}
            </section>
          )}
          {submissionUncertain && (
            <p className="m-0 text-[0.8125rem] text-[#991b1b]" role="alert">
              We couldn't confirm the request status. Check Trips before trying again.
              {" "}
              <a className="font-semibold text-brand-dark underline" href="/trips">
                Check Trips
              </a>
            </p>
          )}
          <button
            className="min-h-11 cursor-pointer rounded-lg border-0 bg-brand text-[0.84rem] font-[650] text-white hover:enabled:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 [@media(max-width:720px)]:hidden"
            disabled={!canBook || isSubmitting || isStartingPayment}
            type="submit"
          >
            {isSubmitting
              ? "Sending booking request…"
              : showReview
                ? "Request booking"
                : "Review booking"}
          </button>
          <p className="m-0 text-[0.8125rem] leading-[1.5] text-muted">
            Booking and payment statuses are shown only after the server confirms them.
          </p>
          {!hasCancellationPolicy && (
            <p
              className="m-0 text-[0.8125rem] leading-[1.5] text-[#8b2525]"
              role="status"
            >
              Booking is temporarily unavailable while cancellation terms are updated.
            </p>
          )}
          {message && (
            <p
              aria-live="polite"
              className="m-0 text-[0.8125rem] leading-[1.5] text-[#8b2525]"
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
          <div
            aria-label="Quick reserve"
            className="hostel-booking-mobile-bar fixed inset-x-0 bottom-0 z-[90] hidden items-center justify-between gap-4 border-t border-line bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] [@media(max-width:720px)]:flex"
            role="region"
          >
            <div className="min-w-0">
              <p className="m-0 flex items-baseline gap-1 text-sm text-muted">
                {room ? (
                  <>
                    <strong className="text-[1rem] font-bold text-ink tabular-nums">
                      PKR {formatPrice(room.pricePerMonth)}
                    </strong>
                    <span>/ month</span>
                  </>
                ) : (
                  <strong className="text-[0.9rem] font-semibold text-ink">
                    Rates unavailable
                  </strong>
                )}
              </p>
              <p className="m-0 mt-0.5 truncate text-[0.8125rem] text-muted">
                {estimatedTotal !== null
                  ? `Estimated total PKR ${formatPrice(estimatedTotal)}`
                  : "Choose dates to see your stay total"}
              </p>
            </div>
            <button
              className="min-h-12 min-w-[132px] shrink-0 cursor-pointer rounded-lg border-0 bg-brand px-5 text-[0.9rem] font-semibold text-white hover:enabled:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !hasCancellationPolicy ||
                isSubmitting ||
                isStartingPayment ||
                Boolean(bookingOutcome) ||
                submissionUncertain ||
                (availabilityLoading && Boolean(checkIn && checkOut))
              }
              onClick={canBook ? undefined : handleQuickReserve}
              type={canBook ? "submit" : "button"}
            >
              {isSubmitting || isStartingPayment ? "Please wait…" : quickReserveLabel}
            </button>
          </div>
        </form>
      ) : (
        <p
          className="m-0 text-[0.8125rem] leading-[1.5] text-[#8b2525]"
          role="status"
        >
          No rooms are currently available to book.
        </p>
      )}
      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-brand px-4 text-center text-sm font-semibold text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        href={availabilityAlertHref}
      >
        Alert me when these dates are available
      </Link>
    </aside>
  );
}
