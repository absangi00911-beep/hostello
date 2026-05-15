// Path: src/app/owner/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  Building2,
  CalendarCheck,
  Clock,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { PageSpinner, StatusBadge, formatPKR } from "@/components/ui/shared";

/* ── Stat tile — horizontal: label left, number right ─────── */
function StatTile({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-5 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
          <Icon size={17} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
        </div>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-8 skeleton rounded-[var(--radius-sm)]" />
      ) : (
        <p
          className="text-[1.75rem] font-[700] leading-none text-[var(--color-text-heading)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

/* ── Recent bookings row ─────────────────────────────────── */
function BookingRow({ booking }: { booking: any }) {
  return (
    <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]">
      <td className="py-3.5 pr-4">
        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate max-w-[140px]">
          {booking.user?.name ?? "—"}
        </p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate max-w-[140px]">
          {booking.user?.email}
        </p>
      </td>
      <td className="py-3.5 pr-4">
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[160px]">
          {booking.hostel?.name}
        </p>
      </td>
      <td className="py-3.5 pr-4 whitespace-nowrap">
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {format(new Date(booking.checkIn), "d MMM")} →{" "}
          {format(new Date(booking.checkOut), "d MMM yyyy")}
        </p>
      </td>
      <td className="py-3.5 pr-4 whitespace-nowrap">
        <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
          {formatPKR(booking.total)}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <StatusBadge variant={booking.status.toLowerCase() as any} />
      </td>
      <td className="py-3.5">
        <Link
          href={`/owner/bookings?id=${booking.id}`}
          className="text-[var(--text-caption)] text-[var(--color-text-link)] hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function OwnerDashboardPage() {
  const { data: bookingsData, isLoading: loadingBookings } = useQuery<{
    data: any[];
    total: number;
  }>({
    queryKey: ["owner-bookings-overview"],
    queryFn: async () => {
      const res = await fetch("/api/bookings?limit=10");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: listingsData, isLoading: loadingListings } = useQuery<{
    data: any[];
    total: number;
  }>({
    queryKey: ["owner-listings-overview"],
    queryFn: async () => {
      const res = await fetch("/api/hostels/mine");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const bookings = bookingsData?.data ?? [];
  const listings = listingsData?.data ?? [];

  const activeListings  = listings.filter((l: any) => l.status === "ACTIVE").length;
  const activeBookings  = bookings.filter((b: any) => b.status === "CONFIRMED").length;
  const pendingRequests = bookings.filter((b: any) => b.status === "PENDING").length;

  const loading = loadingBookings || loadingListings;

  return (
    <div className="space-y-6">
      {/* Stat tiles — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Listings"         value={listings.length}  icon={Building2}    loading={loadingListings} />
        <StatTile label="Active bookings"  value={activeBookings}   icon={CalendarCheck} loading={loadingBookings} />
        <StatTile label="Pending requests" value={pendingRequests}  icon={Clock}        loading={loadingBookings} />
        <StatTile label="Active listings"  value={activeListings}   icon={MessageCircle} loading={loadingListings} />
      </div>

      {/* Recent booking requests */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <h2
            className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Recent bookings
          </h2>
          <Link
            href="/owner/bookings"
            className="flex items-center gap-1 text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline"
          >
            View all
            <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5">
            <PageSpinner label="Loading…" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)] mx-auto mb-2" aria-hidden="true" />
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">No bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]" aria-label="Recent bookings">
              <thead>
                <tr className="border-b border-[var(--color-border-default)]">
                  {["Student", "Hostel", "Dates", "Total", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-0 pb-2.5 pt-3 pr-4 first:pl-5 last:pl-0 last:pr-5 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {bookings.slice(0, 10).map((b: any) => (
                  <tr key={b.id} className="hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]">
                    <td className="py-3.5 pl-5 pr-4">
                      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate max-w-[140px]">
                        {b.user?.name ?? "—"}
                      </p>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate max-w-[140px]">
                        {b.user?.email}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[160px]">
                        {b.hostel?.name}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                        {format(new Date(b.checkIn), "d MMM")} → {format(new Date(b.checkOut), "d MMM yyyy")}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
                        {formatPKR(b.total)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge variant={b.status.toLowerCase() as any} />
                    </td>
                    <td className="py-3.5 pr-5">
                      <Link
                        href={`/owner/bookings`}
                        className="text-[var(--text-caption)] text-[var(--color-text-link)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}