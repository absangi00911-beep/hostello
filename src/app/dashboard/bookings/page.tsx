// Path: src/app/dashboard/bookings/page.tsx
"use client";

import { useState, useMemo } from "react";
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
  BookOpen,
  CheckCircle2,
  Wallet,
  Navigation,
  MapPin,
} from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type Tab = "UPCOMING" | "COMPLETED" | "CANCELLED";

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
    latitude: number | null;
    longitude: number | null;
  };
}

function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function dateRange(booking: Booking) {
  return `${format(new Date(booking.checkIn), "MMM d")} – ${format(new Date(booking.checkOut), "MMM d")}`;
}

/* -- Stat card ------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof BookOpen;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
      <Icon
        size={72}
        strokeWidth={1}
        className="absolute -right-3 -bottom-3 text-[var(--color-bg-overlay)]"
        aria-hidden="true"
      />
      <p className="relative text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className={`relative mt-1.5 font-heading text-[2rem] font-[800] ${accent ? "text-[var(--color-primary)]" : "text-[var(--color-text-heading)]"}`}>
        {value}
      </p>
    </div>
  );
}

/* -- Featured "Next Adventure" card --------------------------- */
function NextAdventureCard({ booking }: { booking: Booking }) {
  const { hostel } = booking;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] sm:flex">
      <div className="relative h-48 sm:h-auto sm:w-72 shrink-0 bg-[var(--color-bg-overlay)]">
        {hostel.coverImage ? (
          <Image src={hostel.coverImage} alt={hostel.name} fill className="object-cover" sizes="288px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge variant={booking.status.toLowerCase() as any} />
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/hostels/${hostel.slug}`}
            className="text-[var(--text-h4)] font-[700] text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
          >
            {hostel.name}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-sidebar)] px-2.5 py-1 text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)]">
            <MapPin size={11} strokeWidth={2} aria-hidden="true" />
            {hostel.city}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          <Calendar size={14} strokeWidth={1.5} aria-hidden="true" />
          {dateRange(booking)} · {booking.months} {booking.months === 1 ? "month" : "months"} · {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/booking/${booking.id}/confirmation`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[600] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
          >
            View Details
          </Link>
          <Link
            href={`/dashboard/messages?hostel=${hostel.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
          >
            <MessageCircle size={14} strokeWidth={1.5} aria-hidden="true" />
            Message Host
          </Link>
          {hostel.latitude !== null && hostel.longitude !== null && (
            <a
              href={directionsUrl(hostel.latitude, hostel.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
            >
              <Navigation size={13} strokeWidth={1.5} aria-hidden="true" />
              Get Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Compact row for extra upcoming bookings ------------------- */
function UpcomingRow({ booking }: { booking: Booking }) {
  const { hostel } = booking;
  return (
    <Link
      href={`/booking/${booking.id}/confirmation`}
      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-3 transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-overlay)]"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-overlay)]">
        {hostel.coverImage ? (
          <Image src={hostel.coverImage} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{hostel.name}</p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{dateRange(booking)}</p>
      </div>
      <StatusBadge variant={booking.status.toLowerCase() as any} />
    </Link>
  );
}

/* -- Past stays table row --------------------------------------- */
function PastStayRow({ booking }: { booking: Booking }) {
  const { hostel } = booking;
  return (
    <tr className="border-b border-[var(--color-border-subtle)] last:border-b-0">
      <td className="px-4 py-3">
        <Link
          href={`/hostels/${hostel.slug}`}
          className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
        >
          {hostel.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-text-body)]">{dateRange(booking)}</td>
      <td className="px-4 py-3 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)]">{formatPKR(booking.total)}</td>
      <td className="px-4 py-3"><StatusBadge variant={booking.status.toLowerCase() as any} /></td>
      <td className="px-4 py-3 text-right">
        {booking.status === "COMPLETED" ? (
          <Link
            href={`/dashboard/bookings/${booking.id}/review`}
            className="inline-flex items-center gap-1 text-[var(--text-caption)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            <Star size={12} strokeWidth={1.5} aria-hidden="true" />
            Leave a Review
          </Link>
        ) : (
          <Link
            href={`/booking/${booking.id}/confirmation`}
            className="inline-flex items-center gap-1 text-[var(--text-caption)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
            Details
          </Link>
        )}
      </td>
    </tr>
  );
}

/* -- Page --------------------------------------------------- */
export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("UPCOMING");
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

  const { upcoming, completed, cancelled, totalSpent } = useMemo(() => {
    const now = new Date();
    const upcoming = allBookings
      .filter((b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.checkOut) >= now)
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    const completed = allBookings.filter((b) => b.status === "COMPLETED");
    const cancelled = allBookings.filter((b) => b.status === "CANCELLED");
    const totalSpent = completed.reduce((sum, b) => sum + b.total, 0);
    return { upcoming, completed, cancelled, totalSpent };
  }, [allBookings]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "UPCOMING",  label: "Upcoming",  count: upcoming.length },
    { key: "COMPLETED", label: "Completed", count: completed.length },
    { key: "CANCELLED", label: "Cancelled", count: cancelled.length },
  ];

  if (isLoading) return <PageSpinner label="Loading bookings…" />;
  if (isError)   return <InlineError message="Couldn't load your bookings. Please refresh." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]">
          My Bookings
        </h2>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Upcoming Stays" value={upcoming.length} accent />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} />
        <StatCard icon={Wallet} label="Total Spent" value={formatPKR(totalSpent)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-[var(--color-border-subtle)]" role="tablist" aria-label="Booking status">
        {TABS.map(({ key, label, count }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`h-10 px-3.5 text-[var(--text-body-sm)] font-[600] border-b-2 transition-colors duration-[var(--transition-fast)] ${
                active
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Upcoming tab */}
      {tab === "UPCOMING" && (
        upcoming.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            heading="No upcoming stays"
            description="When you book a hostel, it'll show up here."
            action={
              <Link href="/hostels" className="inline-flex h-9 items-center px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]">
                Find a hostel
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="mb-3 text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]">Next Adventure</h3>
              <NextAdventureCard booking={upcoming[0]} />
            </div>
            {upcoming.length > 1 && (
              <div className="space-y-2">
                {upcoming.slice(1).map((b) => <UpcomingRow key={b.id} booking={b} />)}
              </div>
            )}
            {/* Cancel is still available for a PENDING booking, surfaced here rather than buried in the featured card */}
            {upcoming[0].status === "PENDING" && (
              <button
                onClick={() => cancelMutation.mutate(upcoming[0].id)}
                disabled={cancellingId === upcoming[0].id}
                className="inline-flex items-center gap-1.5 text-[var(--text-caption)] font-[500] text-[var(--color-error)] hover:underline disabled:opacity-50"
              >
                {cancellingId === upcoming[0].id && <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
                Cancel this booking
              </button>
            )}
          </div>
        )
      )}

      {/* Completed tab — table, matches "Past Stays" */}
      {tab === "COMPLETED" && (
        completed.length === 0 ? (
          <EmptyState icon={CheckCircle2} heading="No completed stays yet" description="Past stays will appear here once they wrap up." />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]">
                  {["Hostel", "Dates", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.map((b) => (
                  <PastStayRow key={b.id} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Cancelled tab */}
      {tab === "CANCELLED" && (
        cancelled.length === 0 ? (
          <EmptyState icon={BookOpen} heading="No cancelled bookings" description="Nothing here — that's a good thing." />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]">
                  {["Hostel", "Dates", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cancelled.map((b) => (
                  <PastStayRow key={b.id} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
