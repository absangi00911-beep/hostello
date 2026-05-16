// Path: src/app/dashboard/price-alerts/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingDown, Trash2, Plus, Search, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  formatPKR,
} from "@/components/ui/shared";

/* -- Types ------------------------------------------------- */
interface PriceAlert {
  id: string;
  targetPrice: number;
  lastKnownPrice?: number | null;
  active: boolean;
  hostel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    pricePerMonth: number;
  };
}

/* -- Alert row --------------------------------------------- */
function AlertRow({
  alert,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  alert: PriceAlert;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const currentPrice = alert.hostel.pricePerMonth;
  const priceDrop    = currentPrice < alert.targetPrice;

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-4 py-3.5">
      {/* Alert icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${priceDrop ? "bg-[var(--color-success-bg)]" : "bg-[var(--color-bg-sidebar)]"}`}>
        <TrendingDown
          size={18}
          strokeWidth={1.5}
          className={priceDrop ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}
          aria-hidden="true"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
          {alert.hostel.name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[var(--text-caption)] text-[var(--color-text-muted)]">
          <span>Target: <strong className="font-[500] text-[var(--color-text-body)]">{formatPKR(alert.targetPrice)}</strong></span>
          <span>Current: <strong className={`font-[500] ${priceDrop ? "text-[var(--color-success)]" : "text-[var(--color-text-body)]"}`}>{formatPKR(currentPrice)}</strong></span>
        </div>
        {priceDrop && (
          <p className="text-[var(--text-caption)] text-[var(--color-success)] mt-0.5 font-[500]">
            Price is below your target!
          </p>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => onToggle(alert.id, !alert.active)}
        disabled={toggling}
        role="switch"
        aria-checked={alert.active}
        aria-label={`${alert.active ? "Disable" : "Enable"} alert for ${alert.hostel.name}`}
        className={`relative flex h-6 w-10 shrink-0 items-center rounded-full border-0 transition-colors duration-[150ms] ease-out focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 disabled:opacity-50 ${alert.active ? "bg-[var(--color-action)]" : "bg-[var(--color-border-strong)]"}`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-[150ms] ease-out ${alert.active ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(alert.id)}
        disabled={deleting}
        aria-label={`Delete alert for ${alert.hostel.name}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/* -- Add alert sheet --------------------------------------- */
function AddAlertSheet({ onAdded }: { onAdded: () => void }) {
  const [open,        setOpen]        = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [selectedId,  setSelectedId]  = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [searching,   setSearching]   = useState(false);
  const [results,     setResults]     = useState<any[]>([]);
  const [submitting,  setSubmitting]  = useState(false);

  async function handleSearch(q: string) {
    setSearchQ(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res  = await fetch(`/api/hostels?q=${encodeURIComponent(q)}&limit=6`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch { /* silent */ }
    finally { setSearching(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !targetPrice) return;
    setSubmitting(true);
    try {
      const res  = await fetch("/api/price-alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hostelId: selectedId, targetPrice: parseInt(targetPrice) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to create alert."); return; }
      toast.success("Price alert created.");
      setOpen(false);
      setSearchQ(""); setSelectedId(""); setTargetPrice(""); setResults([]);
      onAdded();
    } catch { toast.error("Something went wrong."); }
    finally { setSubmitting(false); }
  }

  const selectedHostel = results.find((h) => h.id === selectedId);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]">
          <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
          Add alert
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] bg-[var(--color-bg-card)] border-l border-[var(--color-border-default)] p-6"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] text-left" style={{ fontFamily: "var(--font-body)" }}>
            Add price alert
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hostel search */}
          <div className="space-y-2">
            <label className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">
              Search hostel
            </label>
            <div className="relative">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={searchQ}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type a hostel name…"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-9 pr-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)] transition-all duration-[var(--transition-base)]"
              />
              {searching && <Loader2 size={14} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" aria-hidden="true" />}
            </div>

            {/* Results */}
            {results.length > 0 && !selectedId && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-[var(--shadow-md)] max-h-48 overflow-y-auto">
                {results.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { setSelectedId(h.id); setSearchQ(h.name); setResults([]); setTargetPrice(String(Math.round(h.pricePerMonth * 0.9))); }}
                    className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-[var(--color-bg-overlay)] transition-colors text-left"
                  >
                    <div>
                      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">{h.name}</p>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{h.city}</p>
                    </div>
                    <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)] shrink-0 ml-3">
                      {formatPKR(h.pricePerMonth)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedHostel && (
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-primary-faint)] border border-[var(--color-primary-light)] px-3 py-2">
                <div>
                  <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-primary-deep)]">{selectedHostel.name}</p>
                  <p className="text-[var(--text-caption)] text-[var(--color-primary)]">Current: {formatPKR(selectedHostel.pricePerMonth)}</p>
                </div>
                <button type="button" onClick={() => { setSelectedId(""); setSearchQ(""); setTargetPrice(""); }} className="text-[var(--text-caption)] text-[var(--color-primary)] hover:underline">Change</button>
              </div>
            )}
          </div>

          {/* Target price */}
          <div className="space-y-1.5">
            <label htmlFor="target-price" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">
              Alert me when price drops below (PKR)
            </label>
            <input
              id="target-price"
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 8000"
              min={1000}
              required
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3.5 text-[var(--text-body-sm)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)] transition-all duration-[var(--transition-base)]"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedId || !targetPrice || submitting}
            className="inline-flex w-full items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Creating…" : "Create alert"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* -- Page --------------------------------------------------- */
export default function PriceAlertsPage() {
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: PriceAlert[] }>({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/price-alerts");
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      setTogglingId(id);
      const res = await fetch(`/api/price-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["price-alerts"] }),
    onError:   () => toast.error("Couldn't update alert."),
    onSettled: () => setTogglingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const res = await fetch(`/api/price-alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Alert deleted.");
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
    onError:   () => toast.error("Couldn't delete alert."),
    onSettled: () => setDeletingId(null),
  });

  if (isLoading) return <PageSpinner label="Loading price alerts…" />;
  if (isError)   return <InlineError message="Couldn't load your alerts. Please refresh." />;

  const alerts = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddAlertSheet onAdded={() => queryClient.invalidateQueries({ queryKey: ["price-alerts"] })} />
      </div>

      {/* List */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          heading="No price alerts"
          description="Get notified by email when a hostel drops below your target price."
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Price alerts">
          {alerts.map((alert) => (
            <div key={alert.id} role="listitem">
              <AlertRow
                alert={alert}
                onToggle={(id, active) => toggleMutation.mutate({ id, active })}
                onDelete={(id) => deleteMutation.mutate(id)}
                toggling={togglingId === alert.id}
                deleting={deletingId === alert.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
