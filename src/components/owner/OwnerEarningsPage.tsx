"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BankDetailsCard } from "./BankDetailsCard";
import { FormSection, secondaryButtonClassName } from "./ListingFormFields";
import {
  PAYOUT_STATUS_LABELS,
  parseEarnings,
  readEarningsError,
  type BankDetails,
  type OwnerPayout,
  type PayoutStatus,
} from "./ownerEarnings";

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

const statusBadgeClassName: Record<PayoutStatus, string> = {
  PENDING: "bg-warn-soft text-warn-ink",
  PAID: "bg-brand-soft text-brand-dark",
  CANCELLED: "bg-surface-muted text-muted",
};

function PayoutRow({ payout }: { payout: OwnerPayout }) {
  return (
    <li className="grid gap-1 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[1rem] font-semibold text-ink">
          {currencyFormatter.format(payout.amount)}
        </span>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${statusBadgeClassName[payout.status]}`}
        >
          {PAYOUT_STATUS_LABELS[payout.status]}
        </span>
      </div>
      <p className="m-0 text-[0.85rem] text-muted">
        Batch created {dateFormatter.format(new Date(payout.createdAt))}
        {payout.status === "PAID" && payout.paidAt
          ? ` · paid ${dateFormatter.format(new Date(payout.paidAt))}`
          : ""}
      </p>
      {payout.reference ? (
        <p className="m-0 text-[0.85rem] text-muted">
          Reference: <span className="text-ink">{payout.reference}</span>
        </p>
      ) : null}
    </li>
  );
}

export interface OwnerEarningsContentProps {
  isLoading: boolean;
  loadError: string | null;
  pendingBalance: number;
  hasBankDetails: boolean;
  bankDetails: BankDetails | null;
  payouts: OwnerPayout[];
  payoutTotal: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  moreError: string | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onBankSaved: (details: BankDetails) => void;
}

export function OwnerEarningsContent({
  isLoading,
  loadError,
  pendingBalance,
  hasBankDetails,
  bankDetails,
  payouts,
  payoutTotal,
  hasMore,
  isLoadingMore,
  moreError,
  onRetry,
  onLoadMore,
  onBankSaved,
}: OwnerEarningsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/owner"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Earnings
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Payouts are sent in batches by the HostelLo team after a stay ends.
      </p>

      {isLoading ? (
        <p className="text-muted" role="status">
          Loading earnings...
        </p>
      ) : loadError ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-danger">{loadError}</p>
          <button
            className={`${secondaryButtonClassName} mt-3`}
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          <section
            aria-labelledby="ready-for-payout"
            className="grid gap-2 rounded-[16px] border border-line bg-surface p-5 sm:p-6"
          >
            <h2
              className="m-0 text-[0.9rem] font-semibold text-muted"
              id="ready-for-payout"
            >
              Ready for payout
            </h2>
            <p className="m-0 text-[2rem] font-bold tracking-[-0.03em] text-ink">
              {currencyFormatter.format(pendingBalance)}
            </p>
            <p className="m-0 text-[0.85rem] text-muted">
              Confirmed, paid stays that have ended and aren&apos;t in a payout
              batch yet.
            </p>
            {pendingBalance > 0 && !hasBankDetails ? (
              <p
                className="m-0 mt-1 rounded-[12px] bg-warn-soft px-3 py-2 text-[0.85rem] text-warn-ink"
                role="note"
              >
                Add your bank details below so we can send this to you.
              </p>
            ) : null}
          </section>

          <BankDetailsCard details={bankDetails} onSaved={onBankSaved} />

          <FormSection title="Payout history">
            {payouts.length === 0 ? (
              <p className="m-0 text-[0.92rem] text-muted">
                No payouts yet. They appear here once a batch is created for you.
              </p>
            ) : (
              <>
                <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                  {payoutTotal} {payoutTotal === 1 ? "payout" : "payouts"}
                </p>
                <ul className="m-0 grid list-none gap-3 p-0">
                  {payouts.map((payout) => (
                    <PayoutRow key={payout.id} payout={payout} />
                  ))}
                </ul>
              </>
            )}
            {moreError ? (
              <p
                className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
                role="alert"
              >
                {moreError}
              </p>
            ) : null}
            {hasMore ? (
              <div className="text-center">
                <button
                  className={secondaryButtonClassName}
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  type="button"
                >
                  {isLoadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
          </FormSection>
        </div>
      )}
    </main>
  );
}

async function fetchEarnings(page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(`/api/owner/earnings?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readEarningsError(payload, "Could not load your earnings."));
  }
  const parsed = parseEarnings(payload);
  if (!parsed) throw new Error("Could not load your earnings.");
  return parsed;
}

export function OwnerEarningsPage() {
  const [pendingBalance, setPendingBalance] = useState(0);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [payouts, setPayouts] = useState<OwnerPayout[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchEarnings(1, controller.signal)
      .then((result) => {
        setPendingBalance(result.pendingBalance);
        setHasBankDetails(result.hasBankDetails);
        setBankDetails(result.bankDetails);
        setPayouts(result.payouts);
        setPayoutTotal(result.payoutTotal);
        setPage(result.payoutPage);
        setHasMore(result.payoutHasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load your earnings.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchEarnings(page + 1);
      setPayouts((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.payouts.filter((item) => !seen.has(item.id))];
      });
      setPayoutTotal(result.payoutTotal);
      setPage(result.payoutPage);
      setHasMore(result.payoutHasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more payouts.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  return (
    <OwnerEarningsContent
      bankDetails={bankDetails}
      hasBankDetails={hasBankDetails}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      onBankSaved={(details) => {
        setBankDetails(details);
        setHasBankDetails(true);
      }}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      payoutTotal={payoutTotal}
      payouts={payouts}
      pendingBalance={pendingBalance}
    />
  );
}
