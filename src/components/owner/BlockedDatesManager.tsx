// Path: src/components/owner/BlockedDatesManager.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarOff, Trash2, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface BlockedRangesResponse {
  data: BlockedRange[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface Props {
  hostelId: string;
}

const inputCls =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15 transition-all";

const labelCls =
  "block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)] mb-1.5";

export function BlockedDatesManager({ hostelId }: Props) {
  const qc = useQueryClient();
  const [start, setStart]   = useState("");
  const [end, setEnd]       = useState("");
  const [reason, setReason] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Fetch existing blocked ranges
  const { data, isLoading, isFetching } = useQuery<BlockedRangesResponse>({
    queryKey: ["blocked-dates", hostelId, page],
    queryFn: () =>
      fetch(`/api/owner/hostels/${hostelId}/blocked-dates?page=${page}&limit=20`).then((r) => r.json()),
  });

  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, Math.ceil(data.total / data.limit));
    if (page > lastPage) setPage(lastPage);
  }, [data, page]);

  // Add a range
  const addMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/owner/hostels/${hostelId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end, reason: reason || undefined }),
      }).then((r) => r.json()),
    onSuccess: (json) => {
      if (json.error) { setError(json.error); return; }
      setPage(1);
      qc.invalidateQueries({ queryKey: ["blocked-dates", hostelId] });
      setStart(""); setEnd(""); setReason(""); setError(null);
    },
  });

  // Delete a range
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/owner/hostels/${hostelId}/blocked-dates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocked-dates", hostelId] }),
  });

  function handleAdd() {
    setError(null);
    if (!start || !end) { setError("Both dates are required."); return; }
    if (end < start) { setError("End date must be on or after start date."); return; }
    addMutation.mutate();
  }

  return (
    <section className="owner-blocked-dates rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 mt-8" aria-labelledby="blocked-dates-heading">

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
          <CalendarOff size={16} strokeWidth={1.5} className="text-[color:var(--color-primary)]" aria-hidden="true" />
        </div>
        <div>
          <h3 id="blocked-dates-heading" className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
            Blocked dates
          </h3>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Block dates for renovations, Ramadan break, or any closure period.
          </p>
        </div>
      </div>

      {/* Existing ranges */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-[color:var(--color-text-muted)]">
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          <span className="text-[length:var(--text-body-sm)]">Loading…</span>
        </div>
      ) : data?.total === 0 ? (
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] py-2 mb-4">
          No blocked dates — your calendar is fully open.
        </p>
      ) : (
        <>
          <ul className="space-y-2 mb-5" aria-label="Blocked date ranges">
            {data?.data.map((range) => (
              <li
                key={range.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-body)]">
                    {format(parseISO(range.startDate), "d MMM yyyy")}
                    {" → "}
                    {format(parseISO(range.endDate), "d MMM yyyy")}
                  </p>
                  {range.reason && (
                    <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] truncate">
                      {range.reason}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(range.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Remove blocked range starting ${format(parseISO(range.startDate), "d MMM")}`}
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-error-bg)] hover:text-[color:var(--color-error-text)] transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {data && data.total > data.limit && (
            <div className="mb-5 flex items-center justify-between gap-3 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              <span>{data.total} blocked ranges · Page {page}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1 || isFetching}
                  aria-label="Previous blocked-date page"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!data.hasMore || isFetching}
                  aria-label="Next blocked-date page"
                >
                  Next
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add new range */}
      <div className="border-t border-[var(--color-border-subtle)] pt-4 space-y-3">
        <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-body)]">
          Add a blocked range
        </p>

        <div className="owner-blocked-date-grid grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="block-start" className={labelCls}>From</label>
            <input
              id="block-start"
              type="date"
              value={start}
              min={tomorrow}
              onChange={(e) => {
                setStart(e.target.value);
                if (end && e.target.value > end) setEnd("");
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="block-end" className={labelCls}>To</label>
            <input
              id="block-end"
              type="date"
              value={end}
              min={start || tomorrow}
              onChange={(e) => setEnd(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="block-reason" className={labelCls}>
            Reason <span className="font-[400] text-[color:var(--color-text-muted)]">(optional)</span>
          </label>
          <input
            id="block-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Renovation, Ramadan break…"
            maxLength={120}
            className={inputCls}
          />
        </div>

        {error && (
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-error-text)]" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={handleAdd}
          loading={addMutation.isPending}
          disabled={!start || !end}
          size="sm"
        >
          {!addMutation.isPending && <Plus size={14} strokeWidth={2} aria-hidden="true" />}
          Block dates
        </Button>
      </div>
    </section>
  );
}
