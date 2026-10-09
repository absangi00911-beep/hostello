"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Loader2, RotateCw } from "lucide-react";
import { EmptyState, InlineError, PageSpinner } from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";

const PAGE_SIZE = 25;

interface ReplayEvent {
  adminUserId: string;
  providerTracker: string;
  reason: string;
  createdAt: string;
}

interface PaymentEvent {
  id: string;
  eventType: string;
  merchantOrderId: string | null;
  tracker: string | null;
  providerState: string | null;
  amountMinorUnits: number | null;
  currency: string | null;
  status: "RETRYABLE" | "RECONCILIATION_REQUIRED";
  processingAttempts: number;
  lastErrorCode: string | null;
  receivedAt: string;
  updatedAt: string;
  replayEvents: ReplayEvent[];
}

interface PaymentEventQueue {
  data: PaymentEvent[];
  total: number;
  page: number;
  limit: number;
}

interface RetryDraft {
  tracker: string;
  reason: string;
  checked: boolean;
}

function statusLabel(status: PaymentEvent["status"]) {
  return status === "RETRYABLE" ? "Retryable delivery" : "Manual reconciliation";
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, RetryDraft>>({});

  const { data, isLoading, isError } = useQuery<PaymentEventQueue>({
    queryKey: ["admin-payment-events", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      const response = await fetch(`/api/admin/payment-events?${params}`);
      if (!response.ok) throw new Error("Could not load payment events");
      return response.json();
    },
    placeholderData: (previous) => previous,
  });

  const retryMutation = useMutation({
    mutationFn: async (event: PaymentEvent) => {
      const draft = drafts[event.id];
      if (!draft || !event.tracker) throw new Error("This event cannot be retried without a provider tracker.");
      const response = await fetch(`/api/admin/payment-events/${event.id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerChecked: draft.checked,
          providerTracker: draft.tracker,
          reason: draft.reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not queue payment event");
      return event.id;
    },
    onSuccess: (eventId) => {
      toast.success("Verified webhook retry queued.");
      setDrafts((current) => {
        const next = { ...current };
        delete next[eventId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-events"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <PageSpinner label="Loading payment events…" />;
  if (isError || !data) return <InlineError message="Couldn't load payment events. Please refresh." />;

  const retryableCount = data.data.filter((event) => event.status === "RETRYABLE").length;
  const reconciliationCount = data.data.filter((event) => event.status === "RECONCILIATION_REQUIRED").length;
  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Payment queue summary">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] p-4">
          <RotateCw size={18} className="text-[color:var(--color-warning-text)]" aria-hidden="true" />
          <div>
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-warning-text)]">Retryable</p>
            <p className="text-[length:var(--text-h5)] font-[700] text-[color:var(--color-text-heading)]">{retryableCount} on this page</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-error)]/25 bg-[var(--color-error-bg)] p-4">
          <AlertTriangle size={18} className="text-[color:var(--color-error)]" aria-hidden="true" />
          <div>
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-error)]">Needs reconciliation</p>
            <p className="text-[length:var(--text-h5)] font-[700] text-[color:var(--color-text-heading)]">{reconciliationCount} on this page</p>
          </div>
        </div>
      </section>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-overlay)] px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
        Retry only transient delivery failures after confirming in Safepay that the exact tracker, current state, amount, and currency still match the signed event. The normal webhook processing rechecks the event against the booking. Events marked for reconciliation are never replayed here.
      </div>

      {data.data.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          heading="No payment events need attention"
          description="Verified Safepay events that fail delivery or need manual reconciliation will appear here."
        />
      ) : (
        <div className="space-y-4">
          {data.data.map((event) => {
            const draft = drafts[event.id] ?? {
              tracker: "",
              reason: "",
              checked: false,
            };
            const retryBlockedReason = event.lastErrorCode === "invalid_stored_event"
              ? "Stored event evidence is invalid; this event cannot be retried."
              : !event.tracker
                ? "The event has no tracker to verify, so it cannot be retried."
                : null;
            const canRetry = event.status === "RETRYABLE" && retryBlockedReason === null;
            const matchesTracker = Boolean(event.tracker) && draft.tracker === event.tracker;
            const canSubmit = canRetry && draft.checked && matchesTracker && draft.reason.trim().length >= 20;

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-4 md:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[length:var(--text-caption)] font-[700] ${
                        event.status === "RETRYABLE"
                          ? "bg-[var(--color-warning-bg)] text-[color:var(--color-warning-text)]"
                          : "bg-[var(--color-error-bg)] text-[color:var(--color-error)]"
                      }`}>
                        {statusLabel(event.status)}
                      </span>
                      <span className="text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-muted)]">{event.eventType}</span>
                    </div>
                    <p className="mt-2 break-all font-mono text-[length:var(--text-caption)] text-[color:var(--color-text-body)]">
                      Event {event.id}
                    </p>
                  </div>
                  <div className="text-right text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                    <p>Received {format(new Date(event.receivedAt), "PP p")}</p>
                    <p>{event.processingAttempts} processing attempt{event.processingAttempts === 1 ? "" : "s"}</p>
                  </div>
                </div>

                <div className="grid gap-x-6 gap-y-3 px-4 py-4 text-[length:var(--text-body-sm)] sm:grid-cols-2 md:px-5 lg:grid-cols-3">
                  <div>
                    <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-text-muted)]">Merchant order</p>
                    <p className="mt-1 break-all font-mono text-[color:var(--color-text-body)]">{event.merchantOrderId ?? "Missing"}</p>
                  </div>
                  <div>
                    <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-text-muted)]">Safepay tracker</p>
                    <p className="mt-1 break-all font-mono text-[color:var(--color-text-body)]">{event.tracker ?? "Missing"}</p>
                  </div>
                  <div>
                    <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-text-muted)]">Provider event</p>
                    <p className="mt-1 text-[color:var(--color-text-body)]">
                      {event.providerState ?? "State unavailable"}
                      {event.amountMinorUnits !== null && event.currency
                        ? ` · ${event.currency} ${(event.amountMinorUnits / 100).toFixed(2)}`
                        : " · amount unavailable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-text-muted)]">Last delivery issue</p>
                    <p className="mt-1 break-words font-mono text-[color:var(--color-text-body)]">{event.lastErrorCode ?? "No error code recorded"}</p>
                  </div>
                </div>

                {event.replayEvents.length > 0 && (
                  <div className="mx-4 border-t border-[var(--color-border-subtle)] py-3 md:mx-5">
                    <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-wide text-[color:var(--color-text-muted)]">Previous retry attestations</p>
                    <ul className="mt-2 space-y-2">
                      {event.replayEvents.map((replay) => (
                        <li key={`${replay.createdAt}-${replay.adminUserId}`} className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                          Admin {replay.adminUserId} · tracker {replay.providerTracker} · {format(new Date(replay.createdAt), "PP p")}
                          <span className="mt-0.5 block break-words text-[color:var(--color-text-body)]">{replay.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {canRetry && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-overlay)]/50 px-4 py-4 md:px-5">
                    <h3 className="flex items-center gap-2 text-[length:var(--text-body-sm)] font-[700] text-[color:var(--color-text-heading)]">
                      <CircleDollarSign size={15} aria-hidden="true" /> Verify before queueing a retry
                    </h3>
                    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-end">
                      <label className="block text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-muted)]">
                        Re-enter exact Safepay tracker
                        <input
                          value={draft.tracker}
                          onChange={(e) => setDrafts((current) => ({ ...current, [event.id]: { ...draft, tracker: e.target.value } }))}
                          autoComplete="off"
                          spellCheck={false}
                          className="mt-1 block h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2.5 font-mono text-[length:var(--text-caption)] text-[color:var(--color-text-body)] outline-none focus:border-[var(--color-primary)]"
                        />
                      </label>
                      <label className="block text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-muted)]">
                        Reconciliation reason (20–500 characters)
                        <textarea
                          value={draft.reason}
                          onChange={(e) => setDrafts((current) => ({ ...current, [event.id]: { ...draft, reason: e.target.value } }))}
                          maxLength={500}
                          rows={2}
                          className="mt-1 block w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2.5 py-2 text-[length:var(--text-caption)] text-[color:var(--color-text-body)] outline-none focus:border-[var(--color-primary)]"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!canSubmit || retryMutation.isPending}
                        onClick={() => retryMutation.mutate(event)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-[length:var(--text-caption)] font-[700] text-[color:var(--color-text-inverse)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {retryMutation.isPending && retryMutation.variables?.id === event.id
                          ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          : <RotateCw size={14} aria-hidden="true" />}
                        Queue verified retry
                      </button>
                    </div>
                    <label className="mt-3 flex items-start gap-2 text-[length:var(--text-caption)] text-[color:var(--color-text-body)]">
                      <input
                        type="checkbox"
                        checked={draft.checked}
                        onChange={(e) => setDrafts((current) => ({ ...current, [event.id]: { ...draft, checked: e.target.checked } }))}
                        className="mt-0.5 accent-[var(--color-primary)]"
                      />
                      I checked Safepay and confirmed this tracker, current payment state, amount, and currency still match the signed event above.
                    </label>
                  </div>
                )}

                {event.status === "RETRYABLE" && retryBlockedReason && (
                  <p className="border-t border-[var(--color-border-subtle)] px-4 py-3 text-[length:var(--text-caption)] text-[color:var(--color-error)] md:px-5">
                    {retryBlockedReason} Review Safepay and the booking manually.
                  </p>
                )}

                {event.status === "RECONCILIATION_REQUIRED" && (
                  <div className="flex items-start gap-2 border-t border-[var(--color-error)]/20 bg-[var(--color-error-bg)] px-4 py-3 text-[length:var(--text-caption)] text-[color:var(--color-error)] md:px-5">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Compare the signed event with Safepay and the booking before changing any state. This event is intentionally excluded from replay.
                  </div>
                )}
              </article>
            );
          })}
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      )}
      <p className="text-center text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
        {data.total} unresolved event{data.total === 1 ? "" : "s"} across all pages
      </p>
    </div>
  );
}
