// Path: src/app/owner/bookings/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
  EmptyState,
} from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";
import { CalendarDays } from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "",          label: "All statuses" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 20;

/* ── Inline action buttons ───────────────────────────────── */
function BookingActions({
  booking,
  onAction,
  actingId,
}: {
  booking: any;
  onAction: (id: string, action: "confirm" | "decline" | "cancel") => void;
  actingId: string | null;
}) {
  const loading = actingId === booking.id;

  if (booking.status !== "PENDING") {
    return (
      <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] italic">
        {booking.status === "CONFIRMED" ? "Confirmed" :
         booking.status === "COMPLETED" ? "Completed" : "Cancelled"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <button
        onClick={() => onAction(booking.id, "confirm")}
        disabled={loading}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--color-success-bg)] border border-[oklch(0.52_0.14_148_/_0.3)] text-[var(--text-caption)] font-[600] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? <Loader2 size={10} className="animate-spin" aria-hidden="true" /> : null}
        Confirm
      </button>
      <button
        onClick={() => onAction(booking.id, "decline")}
        disabled={loading}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.3)] text-[var(--text-caption)] font-[600] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
      >
        Decline
      </button>
    </div>
  );
}

export default function OwnerBookingsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page,   setPage]   = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: any[]; total: number; page: number; limit: number;
  }>({
    queryKey: ["owner-bookings", status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) params.set("status", status);
      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      setActingId(id);
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      return json;
    },
    onSuccess: (_, { action }) => {
      toast.success(
        action === "confirm" ? "Booking confirmed." :
        action === "decline" ? "Booking declined." : "Booking cancelled."
      );
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingId(null),
  });

  const bookings   = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) return <PageSpinner label="Loading bookings…" />;
  if (isError)   return <InlineError message="Couldn't load bookings. Please refresh." />;

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-3 pr-8 text-[var(--text-body-sm)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown size={13} strokeWidth={1.5} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
        </div>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] ml-auto">
          {total} booking{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          heading="No bookings"
          description={status ? "No bookings with this status." : "Booking requests will appear here once students book your hostels."}
        />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]" aria-label="Bookings">
              <thead>
                <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                  {["Student","Hostel","Dates","Total","Status","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] whitespace-nowrap">
                        {b.user?.name ?? "—"}
                      </p>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                        {b.user?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[140px]">
                        {b.hostel?.name}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                        {format(new Date(b.checkIn), "d MMM")} → {format(new Date(b.checkOut), "d MMM yy")}
                      </p>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                        {b.months} mo · {b.guests} guest{b.guests !== 1 ? "s" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
                        {formatPKR(b.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge variant={b.status.toLowerCase() as any} />
                    </td>
                    <td className="px-4 py-3.5">
                      <BookingActions
                        booking={b}
                        onAction={(id, action) => actionMutation.mutate({ id, action })}
                        actingId={actingId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}