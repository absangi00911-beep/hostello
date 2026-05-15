// Path: src/app/admin/bookings/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";

const STATUS_OPTIONS = [
  { value: "",          label: "All statuses" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 20;

/* ── Admin inline actions ────────────────────────────────── */
function AdminBookingActions({
  booking,
  onAction,
  loading,
}: {
  booking: any;
  onAction: (id: string, action: string) => void;
  loading: boolean;
}) {
  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    return (
      <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] italic">
        {booking.status.toLowerCase()}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {booking.status === "PENDING" && (
        <button
          onClick={() => onAction(booking.id, "confirm")}
          disabled={loading}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[oklch(0.45_0.14_148_/_0.4)] text-[var(--text-caption)] font-[600] text-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
        >
          {loading && <Loader2 size={10} className="animate-spin" aria-hidden="true" />}
          Confirm
        </button>
      )}
      <button
        onClick={() => onAction(booking.id, "cancel")}
        disabled={loading}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[oklch(0.52_0.18_22_/_0.4)] text-[var(--text-caption)] font-[600] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white hover:border-[var(--color-error)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
      >
        Cancel
      </button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page,   setPage]   = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: any[]; total: number;
  }>({
    queryKey: ["admin-bookings", status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_SIZE),
      });
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
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      return json;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "confirm" ? "Booking confirmed." : "Booking cancelled.");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
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
          <ChevronDown
            size={13} strokeWidth={1.5}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
        </div>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] ml-auto">
          {total} booking{total !== 1 ? "s" : ""}
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={CalendarDays} heading="No bookings found" description="No bookings match the current filter." />
      ) : (
        <>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]" aria-label="All bookings">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Student","Hostel","Owner","Dates","Total","Status","Actions"].map((h) => (
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
                        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] whitespace-nowrap truncate max-w-[120px]">{b.user?.name ?? "—"}</p>
                        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate max-w-[120px]">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] truncate max-w-[130px]">{b.hostel?.name}</p>
                        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{b.hostel?.city}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] truncate max-w-[120px]">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                          {format(new Date(b.checkIn), "d MMM")} → {format(new Date(b.checkOut), "d MMM yy")}
                        </p>
                        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{b.months} mo</p>
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
                        <AdminBookingActions
                          booking={b}
                          onAction={(id, action) => actionMutation.mutate({ id, action })}
                          loading={actingId === b.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}