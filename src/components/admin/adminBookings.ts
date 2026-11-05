export const ADMIN_BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type AdminBookingStatus = (typeof ADMIN_BOOKING_STATUSES)[number];
export type AdminBookingStatusFilter = AdminBookingStatus | "ALL";

export function isCurrentAdminBookingsFilter(
  requestStatus: AdminBookingStatusFilter,
  activeStatus: AdminBookingStatusFilter,
): boolean {
  return requestStatus === activeStatus;
}

export interface AdminBooking {
  id: string;
  status: AdminBookingStatus;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  roomId: string | null;
  hostel: {
    name: string;
    slug: string;
    city: string | null;
  };
}

export interface AdminBookingsPageData {
  data: AdminBooking[];
  total: number;
  page: number;
  hasMore: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function parseAdminBooking(value: unknown): AdminBooking | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    !(ADMIN_BOOKING_STATUSES as readonly string[]).includes(value.status) ||
    typeof value.paymentStatus !== "string" ||
    !isValidDateString(value.checkIn) ||
    !isValidDateString(value.checkOut) ||
    typeof value.guests !== "number" ||
    !Number.isFinite(value.guests) ||
    typeof value.total !== "number" ||
    !Number.isFinite(value.total) ||
    !isRecord(value.hostel) ||
    typeof value.hostel.name !== "string" ||
    typeof value.hostel.slug !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    status: value.status as AdminBookingStatus,
    paymentStatus: value.paymentStatus,
    checkIn: value.checkIn,
    checkOut: value.checkOut,
    guests: value.guests,
    total: value.total,
    roomId: typeof value.roomId === "string" ? value.roomId : null,
    hostel: {
      name: value.hostel.name,
      slug: value.hostel.slug,
      city: typeof value.hostel.city === "string" ? value.hostel.city : null,
    },
  };
}

export function parseAdminBookingsPage(
  value: unknown,
): AdminBookingsPageData | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    !Number.isFinite(value.total) ||
    typeof value.page !== "number" ||
    !Number.isFinite(value.page) ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseAdminBooking);
  if (data.some((booking) => booking === null)) return null;
  return {
    data: data as AdminBooking[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

export function adminBookingStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
