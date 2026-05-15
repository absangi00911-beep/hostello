// Path: src/app/dashboard/bookings/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  Building2,
  MessageCircle,
  Star,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";
import { ReviewDialog } from "@/components/dashboard/ReviewDialog";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_TABS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL",       label: "All" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  months: number;
  guests: number;
  total: number;
  status: BookingStatus;
  paymentStatus: string;
  hostel: {
    id: string;
    name: string;
    slug: string;
    coverImage: string | null;
    city: string;
  };
}

/* ── Booking card ────────────────────────────────────────── */
function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const { hostel } = booking;

  const checkInFmt  = format(new Date(booking.checkIn),  "d MMM yyyy");
  const checkOutFmt = format(new Date(booking.checkOut), "d MMM yyyy");

  return (
    <>
      <article className="flex flex-col sm:flex-row gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-sm)]">
        {/* Thumbnail */}
        <div className="relative h-24 w-full sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
          {hostel.coverImage ? (
            <Image
              src={hostel.coverImage}
              alt={hostel.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/hostels/${hostel.slug}`}
                className="truncate block text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
              >
                {hostel.name}
              </Link>
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                {hostel.city}
              </p>
            </div>
            <StatusBadge variant={booking.status.toLowerCase() as any} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--text-caption)] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.5} aria-hidden="true" />
              {checkInFmt} → {checkOutFmt}
            </span>
            <span>{booking.months} month{booking.months !== 1 ? "s" : ""}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <span className="text-[var(--text-body-sm)] font-[700] text-[var(--color-primary-deep)]">
              {formatPKR(booking.total)}
            </span>

            {/* Status-gated actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* All statuses — view details */}
              <Link
                href={`/booking/${booking.id}/confirmation`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
              >
                <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
                Details
              </Link>

              {/* PENDING — cancel */}
              {booking.status === "PENDING" && (
                <button
                  onClick={() => onCancel(booking.id)}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-error)] bg-[var(--color-error-bg)] text-[var(--text-caption)] font-[500] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                  ) : null}
                  Cancel
                </button>
              )}

              {/* CONFIRMED — message owner */}
              {booking.status === "CONFIRMED" && (
                <Link
                  href={`/dashboard/messages?hostel=${hostel.id}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-caption)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
                >
                  <MessageCircle size={12} strokeWidth={1.5} aria-hidden="true" />
                  Message owner
                </Link>
              )}

              {/* COMPLETED — leave review */}
              {booking.status === "COMPLETED" && (
                <button
                  onClick={() => setReviewOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-primary-faint)] border border-[var(--color-primary-light)] text-[var(--text-caption)] font-[500] text-[var(--color-primary-deep)] hover:bg-[var(--color-primary-light)] transition-colors duration-[var(--transition-fast)]"
                >
                  <Star size={12} strokeWidth={1.5} aria-hidden="true" />
                  Leave review
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Review dialog — only mounted when needed */}
      {reviewOpen && (
        <ReviewDialog
          hostelId={hostel.id}
          hostelName={hostel.name}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn:  async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      setCancellingId(id);
      const res = await fetch(`/api/bookings/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Cancel failed");
      return json;
    },
    onSuccess: () => {
      toast.success("Booking cancelled.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setCancellingId(null),
  });

  const allBookings = data?.data ?? [];
  const filtered =
    statusFilter === "ALL"
      ? allBookings
      : allBookings.filter((b) => b.status === statusFilter);

  if (isLoading) return <PageSpinner label="Loading bookings…" />;
  if (isError)   return <InlineError message="Couldn't load your bookings. Please refresh." />;

  return (
    <div className="space-y-5">
      {/* Status pill filter */}
      <div
        className="flex gap-1.5 flex-wrap"
        role="group"
        aria-label="Filter bookings by status"
      >
        {STATUS_TABS.map(({ value, label }) => {
          const count =
            value === "ALL"
              ? allBookings.length
              : allBookings.filter((b) => b.status === value).length;
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[var(--text-body-sm)] font-[500] transition-colors duration-[var(--transition-fast)] ${
                active
                  ? "bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[var(--text-caption)] ${active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          heading={statusFilter === "ALL" ? "No bookings" : `No ${statusFilter.toLowerCase()} bookings`}
          description={
            statusFilter === "ALL"
              ? "You haven't booked a hostel yet."
              : "No bookings with this status."
          }
          action={
            statusFilter === "ALL" ? (
              <Link
                href="/hostels"
                className="inline-flex h-9 items-center px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
              >
                Find a hostel
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Your bookings">
          {filtered.map((booking) => (
            <div key={booking.id} role="listitem">
              <BookingCard
                booking={booking}
                onCancel={(id) => cancelMutation.mutate(id)}
                cancelling={cancellingId === booking.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Missing icon import fix
import { BookOpen } from "lucide-react";