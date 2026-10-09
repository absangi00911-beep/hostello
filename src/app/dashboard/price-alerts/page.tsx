"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pause, Trash2, TrendingDown } from "lucide-react";
import { EmptyState, InlineError, PageSpinner, formatPKR } from "@/components/ui/shared";

interface PriceAlert {
  id: string;
  targetPrice: number;
  active: boolean;
  hostel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    pricePerMonth: number;
  };
}

function AlertRow({
  alert,
  onPause,
  onDelete,
  pausing,
  deleting,
}: {
  alert: PriceAlert;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  pausing: boolean;
  deleting: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)]">
        <TrendingDown size={18} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
          {alert.hostel.name}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          <span>Target: <strong className="font-[500] text-[color:var(--color-text-body)]">{formatPKR(alert.targetPrice)}</strong></span>
          <span>Current: <strong className="font-[500] text-[color:var(--color-text-body)]">{formatPKR(alert.hostel.pricePerMonth)}</strong></span>
        </div>
        {!alert.active && <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">Paused</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {alert.active && (
          <button
            type="button"
            onClick={() => onPause(alert.id)}
            disabled={pausing}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-2.5 text-[length:var(--text-caption)] text-[color:var(--color-text-body)] hover:bg-[var(--color-bg-sidebar)] disabled:opacity-50"
          >
            {pausing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(alert.id)}
          disabled={deleting}
          aria-label={`Delete alert for ${alert.hostel.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--color-text-muted)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[color:var(--color-error)] disabled:opacity-50"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function PriceAlertsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: PriceAlert[];
    total: number;
    limit: number;
    hasMore: boolean;
  }>({
    queryKey: ["price-alerts", page],
    queryFn: async () => {
      const response = await fetch(`/api/price-alerts?page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to load alerts");
      return response.json();
    },
  });
  const alerts = data?.data ?? [];

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      setPausingId(id);
      const response = await fetch(`/api/price-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!response.ok) throw new Error("Pause failed");
    },
    onSuccess: () => {
      toast.success("Alert paused.");
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
    onError: () => toast.error("Couldn't pause alert."),
    onSettled: () => setPausingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const response = await fetch(`/api/price-alerts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Alert deleted.");
      if (alerts.length === 1 && page > 1) setPage((current) => Math.max(1, current - 1));
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
    onError: () => toast.error("Couldn't delete alert."),
    onSettled: () => setDeletingId(null),
  });

  if (isLoading) return <PageSpinner label="Loading saved alerts…" />;
  if (isError) return <InlineError message="Couldn't load your saved alerts. Please refresh." />;

  return (
    <div className="student-account-page student-price-alerts space-y-4">
      <header className="student-page-heading">
        <div className="student-page-overline"><span>PERSONAL WATCH</span><span>02 / 05</span></div>
        <h2>Saved price alerts</h2>
        <p>You can pause or remove existing alerts here. New alerts are no longer available.</p>
      </header>

      {data?.total === 0 ? (
        <EmptyState
          icon={TrendingDown}
          heading="No saved alerts"
          description="Your hostel search and saved listings are still available from the dashboard."
        />
      ) : (
        <>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
            {data?.total ?? 0} saved alert{data?.total !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3" role="list" aria-label="Saved price alerts">
            {alerts.map((alert) => (
              <div key={alert.id} role="listitem">
                <AlertRow
                  alert={alert}
                  onPause={(id) => pauseMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  pausing={pausingId === alert.id}
                  deleting={deletingId === alert.id}
                />
              </div>
            ))}
          </div>
          {(page > 1 || data?.hasMore) && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm disabled:opacity-50"
              >Previous</button>
              <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                Page {page} of {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)))}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!data?.hasMore}
                className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
