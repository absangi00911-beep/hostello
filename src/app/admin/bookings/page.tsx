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

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
type BookingStatusBadgeVariant = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatusBadgeVariant = "pending" | "paid" | "refunded" | "failed";
type AdminBookingAction = "confirm" | "cancel";

interface BookingRow {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkIn: string;
  checkOut: string;
  months: number;
  total: number;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  hostel?: {
    name?: string | null;
    city?: string | null;
  } | null;
}

const BOOKING_STATUS_BADGES: Record<BookingStatus, BookingStatusBadgeVariant> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const PAYMENT_STATUS_BADGES: Record<PaymentStatus, PaymentStatusBadgeVariant> = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
};

/* -- Admin inline actions ---------------------------------- */
function AdminBookingActions({
  booking,
  onAction,
  onRefund,
  onManualRefund,
  loading,
  refunding,
}: {
  booking: BookingRow;
  onAction: (id: string, action: AdminBookingAction) => void;
  onRefund: (id: string) => void;
  onManualRefund: (id: string) => void;
  loading: boolean;
  refunding: boolean;
}) {
  if (booking.status === "CANCELLED" && booking.paymentStatus === "PAID") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <button
          onClick={() => onRefund(booking.id)}
          disabled={refunding}
          title="Ask Safepay to refund this cancelled booking."
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[oklch(0.68_0.15_72_/_0.4)] text-[length:var(--text-caption)] font-[600] text-[color:var(--color-warning-text)] hover:bg-[var(--color-warning)] hover:text-[color:var(--color-text-inverse)] hover:border-[var(--color-warning)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
        >
          {refunding && <Loader2 size={10} className="animate-spin" aria-hidden="true" />}
          Attempt Safepay refund
        </button>
        <button
          onClick={() => onManualRefund(booking.id)}
          disabled={refunding}
          title="Use only after checking Safepay and completing the refund there."
          className="text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-muted)] underline underline-offset-2 disabled:opacity-50"
        >
          Record completed manual refund
        </button>
      </div>
    );
  }

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    return (
      <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] italic">
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
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-action)]/40 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-action)] hover:bg-[var(--color-action)] hover:text-[color:var(--color-text-inverse)] hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
        >
          {loading && <Loader2 size={10} className="animate-spin" aria-hidden="true" />}
          Confirm
        </button>
      )}
      <button
        onClick={() => onAction(booking.id, "cancel")}
        disabled={loading}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[oklch(0.52_0.18_22_/_0.4)] text-[length:var(--text-caption)] font-[600] text-[color:var(--color-error)] hover:bg-[var(--color-error)] hover:text-[color:var(--color-text-inverse)] hover:border-[var(--color-error)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
      >
        Cancel
      </button>
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page,   setPage]   = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: BookingRow[]; total: number;
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

  const [refundingId, setRefundingId] = useState<string | null>(null);
  const refundMutation = useMutation({
    mutationFn: async ({ id, manualConfirmation = false }: { id: string; manualConfirmation?: boolean }) => {
      setRefundingId(id);
      const res = await fetch(`/api/admin/bookings/${id}/refund`, {
        method: "PATCH",
        ...(manualConfirmation && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manualConfirmation: true }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refund failed");
      return json as { data: unknown; automatic: boolean; manualConfirmed?: boolean };
    },
    onSuccess: ({ automatic, manualConfirmed }) => {
      if (manualConfirmed) {
        toast.success("Manual refund recorded and the student notified.");
      } else if (automatic) {
        toast.success("Refund processed automatically through Safepay.");
      } else {
        toast.warning(
          "Safepay did not confirm the refund. The booking remains marked paid. Check the Safepay dashboard; record a manual refund only after it is completed there.",
          { duration: 10000 },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setRefundingId(null),
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
            className="h-9 appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-3 pr-8 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown
            size={13} strokeWidth={1.5}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]"
            aria-hidden="true"
          />
        </div>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] ml-auto">
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
                      <th key={h} className="px-4 py-3 text-left text-[length:var(--text-label)] font-[600] text-[color:var(--color-text-muted)] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)] whitespace-nowrap truncate max-w-[120px]">{b.user?.name ?? "—"}</p>
                        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] truncate max-w-[120px]">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] truncate max-w-[130px]">{b.hostel?.name}</p>
                        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">{b.hostel?.city}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] truncate max-w-[120px]">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                          {format(new Date(b.checkIn), "d MMM")} → {format(new Date(b.checkOut), "d MMM yy")}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">{b.months} mo</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]">
                          {formatPKR(b.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge variant={BOOKING_STATUS_BADGES[b.status]} />
                          <StatusBadge variant={PAYMENT_STATUS_BADGES[b.paymentStatus]} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <AdminBookingActions
                          booking={b}
                          onAction={(id, action) => actionMutation.mutate({ id, action })}
                          onRefund={(id) => refundMutation.mutate({ id })}
                          onManualRefund={(id) => {
                            if (window.confirm("Confirm that you completed this refund in the Safepay dashboard. The student will be notified.")) {
                              refundMutation.mutate({ id, manualConfirmation: true });
                            }
                          }}
                          loading={actingId === b.id}
                          refunding={refundingId === b.id}
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
