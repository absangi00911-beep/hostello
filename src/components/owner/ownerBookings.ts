export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingStatusFilter = BookingStatus | "ALL";

export const BOOKING_FILTERS: ReadonlyArray<{
  value: BookingStatusFilter;
  label: string;
}> = [
  { value: "PENDING", label: "Needs response" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

/** Owners have 24 hours from the request to respond (see PATCH /api/bookings/[id]). */
export const OWNER_RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface OwnerBooking {
  id: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  months: number;
  guests: number;
  total: number;
  createdAt: string;
  ownerResponseDueAt: string | null;
  hostel: { id: string; name: string };
  student: { name: string; email: string | null; phone: string | null };
}

export interface OwnerBookingsPage {
  data: OwnerBooking[];
  total: number;
  page: number;
  hasMore: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    (BOOKING_STATUSES as readonly string[]).includes(value)
  );
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseBooking(value: unknown): OwnerBooking | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isBookingStatus(value.status) ||
    !isValidDateString(value.checkIn) ||
    !isValidDateString(value.checkOut) ||
    !isValidDateString(value.createdAt) ||
    typeof value.months !== "number" ||
    typeof value.guests !== "number" ||
    typeof value.total !== "number" ||
    !(value.ownerResponseDueAt == null || isValidDateString(value.ownerResponseDueAt)) ||
    !isRecord(value.hostel) ||
    typeof value.hostel.id !== "string" ||
    typeof value.hostel.name !== "string" ||
    !isRecord(value.user) ||
    typeof value.user.name !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    status: value.status,
    checkIn: value.checkIn,
    checkOut: value.checkOut,
    months: value.months,
    guests: value.guests,
    total: value.total,
    createdAt: value.createdAt,
    ownerResponseDueAt:
      typeof value.ownerResponseDueAt === "string" ? value.ownerResponseDueAt : null,
    hostel: { id: value.hostel.id, name: value.hostel.name },
    student: {
      name: value.user.name,
      email: typeof value.user.email === "string" ? value.user.email : null,
      phone: typeof value.user.phone === "string" ? value.user.phone : null,
    },
  };
}

/** Parses the `GET /api/bookings` list response; null when any row is malformed. */
export function parseBookingsPage(value: unknown): OwnerBookingsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseBooking);
  if (data.some((item) => item === null)) return null;
  return {
    data: data as OwnerBooking[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

export function readBookingsError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

/** The API's own message ("Booking confirmed.", "...full refund processed.") when present. */
export function readActionMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

/** Deadline used by the API: the stored due time, else 24 hours after the request. */
export function getResponseDeadline(booking: OwnerBooking): number {
  return booking.ownerResponseDueAt
    ? Date.parse(booking.ownerResponseDueAt)
    : Date.parse(booking.createdAt) + OWNER_RESPONSE_WINDOW_MS;
}

export function formatTimeLeft(ms: number): string {
  if (ms < 60_000) return "less than a minute";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export type ResponseState =
  | { kind: "none" }
  | { kind: "open"; label: string; urgent: boolean }
  | { kind: "expired" };

/** What to show about the response window. Only pending requests have one. */
export function getResponseState(
  booking: OwnerBooking,
  now: number,
): ResponseState {
  if (booking.status !== "PENDING") return { kind: "none" };
  const remaining = getResponseDeadline(booking) - now;
  if (remaining <= 0) return { kind: "expired" };
  return {
    kind: "open",
    label: `Respond within ${formatTimeLeft(remaining)}`,
    urgent: remaining <= 4 * 60 * 60 * 1000,
  };
}
