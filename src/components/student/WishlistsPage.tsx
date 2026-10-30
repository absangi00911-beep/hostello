"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { HostelListing } from "@/components/home/HostelRow";
import { hostelCardImageClassName } from "@/components/hostel-card-styles";

interface FavoritesPage {
  data: HostelListing[];
  page: number;
  hasMore: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHostelListing(value: unknown): value is HostelListing {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    typeof value.city === "string" &&
    (typeof value.area === "string" || value.area === null) &&
    typeof value.pricePerMonth === "number" &&
    Number.isFinite(value.pricePerMonth) &&
    (typeof value.coverImage === "string" || value.coverImage === null) &&
    Array.isArray(value.images) &&
    value.images.every((image) => typeof image === "string") &&
    typeof value.rating === "number" &&
    Number.isFinite(value.rating) &&
    typeof value.reviewCount === "number" &&
    Number.isFinite(value.reviewCount)
  );
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : null;
}

function parseFavoritesPage(value: unknown): FavoritesPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isHostelListing) ||
    typeof value.page !== "number" ||
    !Number.isInteger(value.page) ||
    value.page < 1 ||
    typeof value.hasMore !== "boolean" ||
    (value.hasMore && value.data.length === 0)
  ) {
    return null;
  }

  return {
    data: value.data,
    page: value.page,
    hasMore: value.hasMore,
  };
}

async function loadFavorites(
  page: number,
  signal?: AbortSignal,
): Promise<FavoritesPage> {
  const response = await fetch(`/api/favorites?page=${page}&limit=20`, {
    signal,
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      readApiError(payload) ?? "Could not load your saved hostels.",
    );
  }

  const result = parseFavoritesPage(payload);
  if (!result || result.page !== page) {
    throw new Error("The saved-hostel response was invalid. Please try again.");
  }

  return result;
}

function LoadingCards() {
  return (
    <div
      aria-hidden="true"
      className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-x-4 gap-y-6 [@media(max-width:720px)]:grid-cols-[minmax(0,1fr)] [@media(max-width:720px)]:gap-5"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div className="min-w-0 animate-pulse" key={index}>
          <div className="mb-3 aspect-[1.18] rounded-[14px] bg-surface-muted" />
          <div className="mb-2 h-[14px] w-[76%] rounded-lg bg-surface-muted" />
          <div className="h-[11px] w-[48%] rounded-lg bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

export function WishlistsPageContent({
  error,
  hasMore,
  hostels,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRetry,
}: {
  error: string | null;
  hasMore: boolean;
  hostels: HostelListing[];
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-screen bg-canvas py-12 md:py-16">
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),600px)] md:w-[min(1920px,calc(100%-var(--page-gutter-total)))]">
        <header className="mb-7 md:mb-8">
          <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
            Wishlists
          </h1>
          <p className="mt-2 m-0 text-[0.95rem] text-muted">
            Hostels you have saved for later.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-busy="true"
            className="py-8 text-sm text-muted"
            role="status"
          >
            <p className="m-0">Loading saved hostels...</p>
            <LoadingCards />
          </section>
        ) : error && hostels.length === 0 ? (
          <section
            className="rounded-[14px] border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">{error}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : hostels.length === 0 ? (
          <section
            className="rounded-[14px] border border-line bg-surface p-7"
            role="status"
          >
            <h2 className="m-0 text-[1.2rem] font-semibold text-ink">
              No saved hostels yet
            </h2>
            <p className="mt-2 mb-4 text-[0.95rem] text-muted">
              Save a hostel while exploring and it will appear here.
            </p>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-4 py-2.5 font-semibold text-white"
              href="/"
            >
              Explore hostels
            </Link>
          </section>
        ) : (
          <>
            {error && (
              <p
                className="mb-5 rounded-[14px] border border-[#e7c9c4] bg-surface p-3 text-[0.9rem] text-[#8c2822]"
                role="alert"
              >
                {error}{" "}
                <button
                  className="ml-1 font-semibold text-current underline-offset-2 disabled:opacity-60"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  type="button"
                >
                  Try again
                </button>
              </p>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-x-4 gap-y-6 [@media(max-width:720px)]:grid-cols-[minmax(0,1fr)] [@media(max-width:720px)]:gap-5">
              {hostels.map((hostel) => {
                const image = hostel.coverImage || hostel.images[0];
                return (
                  <article
                    className="hostel-card min-w-0 snap-start overflow-hidden rounded-[14px] border border-line bg-surface"
                    key={hostel.id}
                  >
                    <Link
                      aria-label={`View details for ${hostel.name}`}
                      className="hostel-card-link group block min-w-0 text-inherit"
                      href={`/hostels/${hostel.slug}`}
                    >
                      <div className="hostel-card-image relative aspect-[1.18] overflow-hidden bg-brand-soft">
                        {image ? (
                          <Image
                            alt={hostel.name}
                            className={hostelCardImageClassName}
                            fill
                            sizes="(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 25vw"
                            src={image}
                          />
                        ) : (
                          <div
                            aria-label={`No photo available for ${hostel.name}`}
                            className="hostel-image-fallback h-full w-full bg-[linear-gradient(135deg,transparent_40%,rgb(47_101_73/16%)),var(--brand-soft)]"
                            role="img"
                          />
                        )}
                      </div>
                      <div className="hostel-card-details px-[10px] pt-[11px] pb-3 [@media(max-width:720px)]:px-[9px] [@media(max-width:720px)]:pt-[10px] [@media(max-width:720px)]:pb-[11px]">
                        <h2
                          className="m-0 mb-[6px] overflow-hidden text-[0.95rem] font-semibold leading-[1.25] tracking-normal text-ellipsis whitespace-nowrap"
                          title={hostel.name}
                        >
                          {hostel.name}
                        </h2>
                        <p className="hostel-card-price m-0 mb-[9px] overflow-hidden text-[0.875rem] leading-[1.43] font-semibold text-ellipsis whitespace-nowrap [@media(max-width:720px)]:text-[0.73rem] [font-family:var(--font-inter),_sans-serif]">
                          PKR {hostel.pricePerMonth.toLocaleString("en-PK")}
                          <span className="text-[0.7rem] font-[450] text-muted [@media(max-width:720px)]:text-[0.68rem]">
                            {" / month"}
                          </span>
                        </p>
                        <div className="hostel-card-meta flex items-center justify-between gap-[7px] text-[0.72rem] text-muted [@media(max-width:720px)]:text-[0.68rem]">
                          <span className="hostel-card-area inline-flex min-w-0 items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {hostel.area || hostel.city}
                          </span>
                          <span
                            aria-label={
                              hostel.reviewCount > 0
                                ? `Rated ${hostel.rating.toFixed(1)} out of 5`
                                : "No ratings yet"
                            }
                            className="hostel-card-rating inline-flex min-w-0 flex-[0_0_auto] items-center gap-1 font-semibold text-ink"
                            role="img"
                          >
                            {hostel.reviewCount > 0 ? (
                              <>
                                <Star
                                  aria-hidden="true"
                                  className="text-[#a66a18]"
                                  fill="currentColor"
                                  size={14}
                                />
                                {hostel.rating.toFixed(1)}
                              </>
                            ) : (
                              "New"
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
            {hasMore && (
              <button
                className="mt-7 mx-auto flex min-w-[140px] items-center justify-center rounded-full bg-brand px-4 py-2.5 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                type="button"
              >
                {isLoadingMore ? "Loading..." : "Show more"}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export function WishlistsPage() {
  const [hostels, setHostels] = useState<HostelListing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void loadFavorites(1, controller.signal)
      .then((result) => {
        setHostels(result.data);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load your saved hostels. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  async function loadMore() {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await loadFavorites(page + 1);
      setHostels((current) => [...current, ...result.data]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load more saved hostels. Please try again.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <WishlistsPageContent
      error={error}
      hasMore={hasMore}
      hostels={hostels}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
    />
  );
}
