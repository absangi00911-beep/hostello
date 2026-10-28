"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { HostelListing } from "@/components/home/HostelRow";

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
    <div aria-hidden="true" className="student-listing-grid">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="student-listing-skeleton" key={index}>
          <div className="student-listing-skeleton-image" />
          <div className="student-listing-skeleton-line" />
          <div className="student-listing-skeleton-line student-listing-skeleton-line-short" />
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
    <main className="student-page">
      <div className="student-page-shell">
        <header className="student-page-header">
          <h1>Wishlists</h1>
          <p>Hostels you have saved for later.</p>
        </header>

        {isLoading ? (
          <section aria-busy="true" className="student-page-state" role="status">
            <p>Loading saved hostels...</p>
            <LoadingCards />
          </section>
        ) : error && hostels.length === 0 ? (
          <section className="student-page-error" role="alert">
            <p>{error}</p>
            <button onClick={onRetry} type="button">
              Try again
            </button>
          </section>
        ) : hostels.length === 0 ? (
          <section className="student-page-empty" role="status">
            <h2>No saved hostels yet</h2>
            <p>Save a hostel while exploring and it will appear here.</p>
            <Link href="/">Explore hostels</Link>
          </section>
        ) : (
          <>
            {error && (
              <p className="student-page-error" role="alert">
                {error}{" "}
                <button
                  onClick={onLoadMore}
                  type="button"
                  disabled={isLoadingMore}
                >
                  Try again
                </button>
              </p>
            )}
            <div className="student-listing-grid">
              {hostels.map((hostel) => {
                const image = hostel.coverImage || hostel.images[0];
                return (
                  <article className="hostel-card" key={hostel.id}>
                    <Link
                      aria-label={`View details for ${hostel.name}`}
                      className="hostel-card-link"
                      href={`/hostels/${hostel.slug}`}
                    >
                      <div className="hostel-card-image">
                        {image ? (
                          <Image
                            alt={hostel.name}
                            className="hostel-card-photo"
                            fill
                            sizes="(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 25vw"
                            src={image}
                          />
                        ) : (
                          <div
                            aria-label={`No photo available for ${hostel.name}`}
                            className="hostel-image-fallback"
                            role="img"
                          />
                        )}
                      </div>
                      <div className="hostel-card-details">
                        <h2 title={hostel.name}>{hostel.name}</h2>
                        <p className="hostel-card-price">
                          PKR {hostel.pricePerMonth.toLocaleString("en-PK")}
                          <span> / month</span>
                        </p>
                        <div className="hostel-card-meta">
                          <span className="hostel-card-area">
                            {hostel.area || hostel.city}
                          </span>
                          <span
                            aria-label={
                              hostel.reviewCount > 0
                                ? `Rated ${hostel.rating.toFixed(1)} out of 5`
                                : "No ratings yet"
                            }
                            className="hostel-card-rating"
                            role="img"
                          >
                            {hostel.reviewCount > 0 ? (
                              <>
                                <Star
                                  aria-hidden="true"
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
                className="student-page-load-more"
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
