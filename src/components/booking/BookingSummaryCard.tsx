// Path: src/components/booking/BookingSummaryCard.tsx
import Image from "next/image";
import { Calendar, Users, Building2 } from "lucide-react";
import { StatusBadge, formatPKR } from "@/components/ui/shared";
import { format } from "date-fns";

interface BookingSummaryCardProps {
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    months: number;
    guests: number;
    total: number;
    status: string;
    paymentStatus: string;
    hostel: {
      name: string;
      slug: string;
      city: string;
      area?: string | null;
      coverImage?: string | null;
    };
  };
  /** Show status badges (useful on confirmation page) */
  showStatus?: boolean;
}

export function BookingSummaryCard({
  booking,
  showStatus = false,
}: BookingSummaryCardProps) {
  const { hostel } = booking;

  const checkInFmt  = format(new Date(booking.checkIn),  "d MMM yyyy");
  const checkOutFmt = format(new Date(booking.checkOut), "d MMM yyyy");

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
      {/* Hostel strip */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
          {hostel.coverImage ? (
            <Image
              src={hostel.coverImage}
              alt={hostel.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2
                size={20}
                strokeWidth={1.5}
                className="text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {hostel.name}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
          </p>
        </div>

        {showStatus && (
          <StatusBadge
            variant={booking.status.toLowerCase() as any}
          />
        )}
      </div>

      {/* Booking details grid */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--color-border-subtle)]">
        <div className="p-4 space-y-1">
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={1.5} aria-hidden="true" />
            Check-in
          </p>
          <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)]">
            {checkInFmt}
          </p>
        </div>
        <div className="p-4 space-y-1">
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={1.5} aria-hidden="true" />
            Check-out
          </p>
          <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)]">
            {checkOutFmt}
          </p>
        </div>
      </div>

      {/* Duration + guests + total */}
      <div className="px-4 pb-4 pt-0 space-y-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            <Users size={13} strokeWidth={1.5} aria-hidden="true" />
            {booking.guests} guest{booking.guests !== 1 ? "s" : ""} ·{" "}
            {booking.months} month{booking.months !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Total row */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
          <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
            Total
          </span>
          <span className="text-[var(--text-h5)] font-[700] text-[var(--color-primary-deep)]">
            {formatPKR(booking.total)}
          </span>
        </div>
      </div>
    </div>
  );
}