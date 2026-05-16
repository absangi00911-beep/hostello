// Path: src/app/admin/search/page.tsx
"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type SyncState = "idle" | "syncing" | "success" | "error";

export default function AdminSearchSyncPage() {
  const [state,   setState]   = useState<SyncState>("idle");
  const [message, setMessage] = useState("");
  const [detail,  setDetail]  = useState("");

  async function handleSync() {
    setState("syncing");
    setMessage("");
    setDetail("");

    try {
      const res  = await fetch("/api/admin/search/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? "Sync failed.");
        return;
      }

      setState("success");
      setMessage("Search index rebuilt successfully.");
      setDetail(
        json.data?.synced
          ? `${json.data.synced} hostel${json.data.synced !== 1 ? "s" : ""} indexed.`
          : ""
      );
    } catch {
      setState("error");
      setMessage("Sync failed. Check your connection and try again.");
    }
  }

  return (
    <div className="max-w-[560px] space-y-6">
      {/* Info card */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
            <RefreshCw
              size={18}
              strokeWidth={1.5}
              className="text-[var(--color-primary)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2
              className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Rebuild search index
            </h2>
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Typesense full re-index
            </p>
          </div>
        </div>

        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">
          This re-indexes all active hostels in Typesense. Use this if search
          results appear out of date, after bulk data changes, or when
          recovering from a Typesense outage.
        </p>

        <div className="rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-[oklch(0.68_0.15_72_/_0.25)] px-4 py-3">
          <p className="text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
            The sync may take 15–60 seconds depending on the number of listings.
            Search will remain available via the Prisma fallback during re-indexing.
          </p>
        </div>
      </div>

      {/* Status feedback */}
      {state === "success" && (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[oklch(0.52_0.14_148_/_0.3)] bg-[var(--color-success-bg)] px-5 py-4">
          <CheckCircle2
            size={18}
            strokeWidth={1.5}
            className="text-[var(--color-success)] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-success-text)]">
              {message}
            </p>
            {detail && (
              <p className="text-[var(--text-body-sm)] text-[var(--color-success-text)] opacity-80 mt-0.5">
                {detail}
              </p>
            )}
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[oklch(0.52_0.18_22_/_0.3)] bg-[var(--color-error-bg)] px-5 py-4">
          <AlertTriangle
            size={18}
            strokeWidth={1.5}
            className="text-[var(--color-error)] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)]">{message}</p>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={handleSync}
        disabled={state === "syncing"}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
      >
        {state === "syncing" ? (
          <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
        )}
        {state === "syncing" ? "Syncing…" : "Run sync now"}
      </button>

      {/* Last sync info */}
      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
        Sync is also triggered automatically on each hostel approval and update.
        Manual sync is only needed for recovery scenarios.
      </p>
    </div>
  );
}
