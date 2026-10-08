// Path: src/app/owner/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  Building2,
  CalendarCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineError, PageSpinner, StatusBadge, formatPKR } from "@/components/ui/shared";

/* -- Stat tile — horizontal: label left, number right ------- */
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
          <Icon size={17} strokeWidth={1.5} className="text-[color:var(--color-primary)]" aria-hidden="true" />
        </div>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-8 skeleton rounded-[var(--radius-sm)]" />
      ) : (
        <p
          className="owner-metric-value text-[length:var(--text-h3)] font-[700] leading-none text-[color:var(--color-text-heading)]"

        >
          {value}
        </p>
      )}
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default function OwnerDashboardPage() {
  const { data: bookingsData, isLoading: loadingBookings, isError: bookingsError } = useQuery<{
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

  const { data: listingsData, isLoading: loadingListings, isError: listingsError } = useQuery<{
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

  if (bookingsError || listingsError) {
    return <InlineError message="Couldn't load your dashboard data. Please refresh." />;
  }

  return (
    <div className="space-y-6">
      {/* Stat tiles — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Listings"         value={listings.length}  icon={Building2}    loading={loadingListings} />
        <StatTile label="Active bookings"  value={activeBookings}   icon={CalendarCheck} loading={loadingBookings} />
        <StatTile label="Pending requests" value={pendingRequests}  icon={Clock}        loading={loadingBookings} />
        <StatTile label="Active listings"  value={activeListings}   icon={Building2}     loading={loadingListings} />
      </div>

      {listings.length === 0 && !loadingListings && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-faint)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
              Start by adding your first listing
            </h2>
            <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              Share your hostel details to begin receiving student requests.
            </p>
          </div>
          <Button asChild size="default" className="shrink-0">
            <Link href="/owner/listings/new">Add listing</Link>
          </Button>
        </div>
      )}

      {/* Recent booking requests */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <h2
            className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]"

          >
            Recent bookings
          </h2>
          <Link
            href="/owner/bookings"
            className="flex items-center gap-1 text-[length:var(--text-body-sm)] text-[color:var(--color-text-link)] hover:underline"
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
            <Clock size={32} strokeWidth={1.5} className="text-[color:var(--color-text-muted)] mx-auto mb-2" aria-hidden="true" />
            <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
              Booking requests will appear here after students submit a request.
            </p>
            <Link
              href="/owner/listings"
              className="mt-2 inline-flex text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)] hover:underline"
            >
              Review your listings
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]" aria-label="Recent bookings">
              <thead>
                <tr className="border-b border-[var(--color-border-default)]">
                  {["Student", "Hostel", "Dates", "Total", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-0 pb-2.5 pt-3 pr-4 first:pl-5 last:pl-0 last:pr-5 text-left text-[length:var(--text-label)] font-[600] text-[color:var(--color-text-muted)]"
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
                      <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)] truncate max-w-[140px]">
                        {b.user?.name ?? "—"}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] truncate max-w-[140px]">
                        {b.user?.email}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] truncate max-w-[160px]">
                        {b.hostel?.name}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                        {format(new Date(b.checkIn), "d MMM")} → {format(new Date(b.checkOut), "d MMM yyyy")}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]">
                        {formatPKR(b.total)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge variant={b.status.toLowerCase() as any} />
                    </td>
                    <td className="py-3.5 pr-5">
                      <Link
                        href={`/owner/bookings`}
                        className="text-[length:var(--text-caption)] text-[color:var(--color-text-link)] hover:underline"
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