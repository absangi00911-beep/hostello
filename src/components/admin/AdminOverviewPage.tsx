"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import {
  parseAdminListingStats,
  readAdminError,
  type AdminListingStats,
} from "./adminListings";

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="grid gap-1 rounded-[14px] border border-line bg-surface p-4">
      <dt className="text-[0.8rem] font-semibold text-muted">{label}</dt>
      <dd className="m-0 text-[1.6rem] font-bold tracking-[-0.03em] text-ink">
        {value}
      </dd>
      {note ? <dd className="m-0 text-[0.8125rem] text-muted">{note}</dd> : null}
    </div>
  );
}

export interface AdminOverviewContentProps {
  isLoading: boolean;
  loadError: string | null;
  stats: AdminListingStats | null;
  onRetry: () => void;
}

export function AdminOverviewContent({
  isLoading,
  loadError,
  stats,
  onRetry,
}: AdminOverviewContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <h1 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Admin console
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Moderate listings and keep the marketplace running.
      </p>

      <div className="grid gap-5">
        <section aria-labelledby="listing-statistics" id="listing-statistics">
          <h2 className="mb-3 mt-0 text-[1.05rem] font-semibold text-ink">
            Listing statistics
          </h2>
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading overview...
            </p>
          ) : loadError || !stats ? (
            <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
              <p className="m-0 text-danger">
                {loadError ?? "Could not load the overview."}
              </p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : (
            <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total listings" value={stats.totalListings} />
              <StatCard label="Pending review" value={stats.pendingApproval} />
              <StatCard
                label="Incomplete"
                note={`Pending, completeness under ${stats.flaggedThreshold}%`}
                value={stats.flaggedCount}
              />
              <StatCard
                label="Newly live"
                note={`Last ${stats.newlyPublishedWindowDays} days`}
                value={stats.newlyPublished}
              />
            </dl>
          )}
        </section>

        <nav aria-label="Admin sections" className="grid gap-3">
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/bookings"
          >
            <span className="text-[1rem] font-semibold text-ink">Bookings</span>
            <span className="text-[0.88rem] text-muted">
              Review booking, payment and stay status without student contact
              details.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin#listing-statistics"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Listing statistics
            </span>
            <span className="text-[0.88rem] text-muted">
              See current listing totals and the published-listing window.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/listings"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Listing review
            </span>
            <span className="text-[0.88rem] text-muted">
              Verify new listings, suspend problem ones and reactivate them.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/verifications"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Student verification
            </span>
            <span className="text-[0.88rem] text-muted">
              Check student documents and approve or reject them.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/roommate-reports"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Roommate reports
            </span>
            <span className="text-[0.88rem] text-muted">
              Review reported roommate posts and delete the ones that break the
              rules.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/payouts"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Owner payouts
            </span>
            <span className="text-[0.88rem] text-muted">
              Generate payout batches, then record the transfer or void the
              batch.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/refunds"
          >
            <span className="text-[1rem] font-semibold text-ink">Refunds</span>
            <span className="text-[0.88rem] text-muted">
              Refund cancelled, paid bookings and resolve unconfirmed refunds.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/payment-events"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Payment events
            </span>
            <span className="text-[0.88rem] text-muted">
              Review Safepay notifications that failed to process and retry
              them.
            </span>
          </Link>
          <Link
            className="grid gap-1 rounded-[14px] border border-line bg-surface p-4 no-underline hover:bg-surface-muted"
            href="/admin/search-sync"
          >
            <span className="text-[1rem] font-semibold text-ink">
              Search index
            </span>
            <span className="text-[0.88rem] text-muted">
              Re-sync listings to search or remove one from the index.
            </span>
          </Link>
        </nav>
      </div>
    </main>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminListingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetch("/api/admin/listings/stats", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readAdminError(payload, "Could not load the overview."));
        }
        const parsed = parseAdminListingStats(payload);
        if (!parsed) throw new Error("Could not load the overview.");
        setStats(parsed);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load the overview.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount]);

  return (
    <AdminOverviewContent
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => setRetryCount((count) => count + 1)}
      stats={stats}
    />
  );
}
