"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarOff, Trash2, Plus, Loader2 } from "lucide-react";

interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface Props {
  hostelId: string;
}

const inputCls =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)] transition-all";

const labelCls =
  "block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-1.5";

export function BlockedDatesManager({ hostelId }: Props) {
  const qc = useQueryClient();
  const [start, setStart]   = useState("");
  const [end, setEnd]       = useState("");
  const [reason, setReason] = useState("");
  const [error, setError]   = useState<string | null>(null);

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Fetch existing blocked ranges
  const { data, isLoading } = useQuery<{ data: BlockedRange[] }>({
    queryKey: ["blocked-dates", hostelId],
    queryFn: () =>
      fetch(`/api/owner/hostels/${hostelId}/blocked-dates`).then((r) => r.json()),
  });

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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 mt-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
          <CalendarOff size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
            Blocked dates
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Block dates for renovations, Ramadan break, or any closure period.
          </p>
        </div>
      </div>

      {/* Existing ranges */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-[var(--color-text-muted)]">
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          <span className="text-[var(--text-body-sm)]">Loading…</span>
        </div>
      ) : data?.data.length === 0 ? (
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] py-2 mb-4">
          No blocked dates — your calendar is fully open.
        </p>
      ) : (
        <ul className="space-y-2 mb-5" aria-label="Blocked date ranges">
          {data?.data.map((range) => (
            <li
              key={range.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)]">
                  {format(parseISO(range.startDate), "d MMM yyyy")}
                  {" → "}
                  {format(parseISO(range.endDate), "d MMM yyyy")}
                </p>
                {range.reason && (
                  <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate">
                    {range.reason}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(range.id)}
                disabled={deleteMutation.isPending}
                aria-label={`Remove blocked range starting ${format(parseISO(range.startDate), "d MMM")}`}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error-text)] transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new range */}
      <div className="border-t border-[var(--color-border-subtle)] pt-4 space-y-3">
        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)]">
          Add a blocked range
        </p>

        <div className="grid grid-cols-2 gap-3">
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
            Reason <span className="font-[400] text-[var(--color-text-muted)]">(optional)</span>
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
          <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)]" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleAdd}
          disabled={addMutation.isPending || !start || !end}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--text-body-sm)] font-[500] hover:bg-[var(--color-primary-deep)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {addMutation.isPending
            ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            : <Plus    size={14} strokeWidth={2}   aria-hidden="true" />}
          Block dates
        </button>
      </div>
    </div>
  );
}
