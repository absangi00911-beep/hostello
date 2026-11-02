"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  STATUS_FILTERS,
  getListingStatusLabel,
  parseListingsPage,
  readListingsError,
  type ListingStatus,
  type ListingStatusFilter,
  type OwnerListing,
} from "./ownerListings";

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const secondaryButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white px-4 text-[0.85rem] font-semibold text-ink no-underline hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand!";

const statusBadgeClassName: Record<ListingStatus, string> = {
  ACTIVE: "bg-brand-soft text-brand-dark",
  PENDING_REVIEW: "bg-[#fbf4e6] text-[#583c13]",
  DRAFT: "bg-surface-muted text-muted",
  SUSPENDED: "bg-[#f9e4e0] text-[#8c2822]",
};

const quickLinks = [
  { href: "/owner/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/owner/earnings", label: "Earnings", icon: Wallet },
  { href: "/owner/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
] as const;

function StatusNote({ status }: { status: ListingStatus }) {
  const note =
    status === "PENDING_REVIEW"
      ? "Under review. It isn't visible to students until it is approved."
      : status === "DRAFT"
        ? "Draft. It isn't visible to students yet."
        : status === "SUSPENDED"
          ? "Suspended and hidden from students."
          : null;
  if (!note) return null;
  return (
    <p className="m-0 text-[0.82rem] text-muted">
      {note}
      {status === "SUSPENDED" ? (
        <>
          {" "}
          <Link
            className="font-semibold text-brand hover:underline"
            href="/contact"
          >
            Contact support
          </Link>
        </>
      ) : null}
    </p>
  );
}

function ListingCard({ listing }: { listing: OwnerListing }) {
  const location = [listing.area, listing.city].filter(Boolean).join(", ");
  return (
    <li className="flex gap-4 rounded-[14px] border border-line bg-surface p-3 sm:p-4">
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-[10px] bg-surface-muted sm:h-28 sm:w-36">
        {listing.coverImage ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="144px"
            src={listing.coverImage}
            unoptimized
          />
        ) : null}
      </div>
      <div className="grid min-w-0 flex-1 content-start gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 min-w-0 text-[1rem] font-semibold text-ink">
            {listing.name}
          </h3>
          <span
            className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${statusBadgeClassName[listing.status]}`}
          >
            {getListingStatusLabel(listing.status)}
          </span>
        </div>
        <p className="m-0 text-[0.85rem] text-muted">{location}</p>
        <p className="m-0 text-[0.85rem] text-ink">
          {currencyFormatter.format(listing.pricePerMonth)} / month ·{" "}
          {listing.rooms} {listing.rooms === 1 ? "room" : "rooms"} ·{" "}
          {listing.capacity} {listing.capacity === 1 ? "bed" : "beds"}
          {listing.reviewCount > 0
            ? ` · ★ ${listing.rating.toFixed(1)} (${listing.reviewCount})`
            : ""}
        </p>
        <StatusNote status={listing.status} />
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {listing.status !== "SUSPENDED" ? (
            <Link
              className="text-[0.85rem] font-semibold text-brand hover:underline"
              href={`/owner/listings/${encodeURIComponent(listing.id)}/edit`}
            >
              Edit
            </Link>
          ) : null}
          {listing.status === "ACTIVE" ? (
            <Link
              className="text-[0.85rem] font-semibold text-brand hover:underline"
              href={`/hostels/${encodeURIComponent(listing.slug)}`}
            >
              View public listing
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export interface OwnerDashboardContentProps {
  ownerName: string;
  filter: ListingStatusFilter;
  items: OwnerListing[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  onFilterChange: (filter: ListingStatusFilter) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

export function OwnerDashboardContent({
  ownerName,
  filter,
  items,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  onFilterChange,
  onLoadMore,
  onRetry,
}: OwnerDashboardContentProps) {
  return (
    <main className="mx-auto w-[min(1100px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <header className="mb-6">
        <h1 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
          Host dashboard
        </h1>
        <p className="mb-0 mt-2 text-[0.95rem] text-muted">
          Welcome back, {ownerName}. Manage your listings here.
        </p>
      </header>

      <nav aria-label="Host tools" className="mb-8 flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-brand px-4 text-[0.85rem] font-semibold text-white no-underline hover:bg-brand-dark focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-2!"
          href="/owner/listings/new"
        >
          Add listing
        </Link>
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link className={`${secondaryButtonClassName} gap-2`} href={href} key={href}>
            <Icon aria-hidden="true" size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="owner-listings-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="m-0 text-[1.2rem] font-semibold text-ink"
              id="owner-listings-heading"
            >
              Your listings
            </h2>
            <p aria-live="polite" className="mb-0 mt-1 text-[0.85rem] text-muted">
              {isLoading
                ? "Loading…"
                : loadError
                  ? ""
                  : `${total} ${total === 1 ? "listing" : "listings"}`}
            </p>
          </div>
        </div>

        <div
          aria-label="Filter listings by status"
          className="mb-5 flex flex-wrap gap-2"
          role="group"
        >
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              aria-pressed={filter === value}
              className="cursor-pointer rounded-full border border-line bg-white px-4 py-[7px] text-[0.82rem] font-semibold text-ink hover:bg-surface-muted aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand-dark focus-visible:outline-2! focus-visible:outline-brand!"
              key={value}
              onClick={() => onFilterChange(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted" role="status">
            Loading listings...
          </p>
        ) : loadError ? (
          <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
            <p className="m-0 text-[#c13515]">{loadError}</p>
            <button
              className={`${secondaryButtonClassName} mt-3`}
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-surface p-6 text-center text-muted">
            {filter === "ALL"
              ? "You don't have any listings yet. Use “Add listing” to create your first one."
              : `No ${getFilterNoun(filter)} listings.`}
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </ul>
        )}

        {moreError ? (
          <p
            className="mt-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
            role="alert"
          >
            {moreError}
          </p>
        ) : null}

        {hasMore && !isLoading && !loadError ? (
          <div className="mt-5 text-center">
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
      </section>
    </main>
  );
}

function getFilterNoun(filter: ListingStatusFilter): string {
  return STATUS_FILTERS.find((entry) => entry.value === filter)?.label.toLowerCase() ?? "";
}

async function fetchListings(
  filter: ListingStatusFilter,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (filter !== "ALL") params.set("status", filter);
  const response = await fetch(`/api/hostels/mine?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readListingsError(payload, "Could not load your listings."));
  }
  const parsed = parseListingsPage(payload);
  if (!parsed) throw new Error("Could not load your listings.");
  return parsed;
}

export function OwnerDashboard({ ownerName }: { ownerName: string }) {
  const [filter, setFilter] = useState<ListingStatusFilter>("ALL");
  const [items, setItems] = useState<OwnerListing[]>([]);
  const [total, setTotal] = useState(0);
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
    setItems([]);
    fetchListings(filter, 1, controller.signal)
      .then((result) => {
        setItems(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load your listings.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [filter, retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchListings(filter, page + 1);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more listings.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, page]);

  return (
    <OwnerDashboardContent
      filter={filter}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      items={items}
      loadError={loadError}
      moreError={moreError}
      onFilterChange={setFilter}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      ownerName={ownerName}
      total={total}
    />
  );
}
