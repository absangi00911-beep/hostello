"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { BrowseHeader, type Category } from "./BrowseHeader";
import { BrowseCategoryNav } from "./BrowseCategoryNav";
import { HostelSearchBar } from "./HostelSearchBar";
import type { HostelSearchFilters } from "./HostelSearchBar";
import { HostelRow, type HostelListing } from "./HostelRow";
import { buildHomeListingsQuery, INITIAL_HOME_CATEGORY, isHostelSearchResponse } from "./home-listings";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { isLoadedResultsCurrent, type LoadedResults } from "@/lib/loaded-results";
import { NEARBY_COORDINATES_SESSION_KEY } from "@/lib/nearby-search";

interface FavoritePage {
  data: { slug: string }[];
  hasMore: boolean;
}

function readErrorMessage(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
}

function isFavoritePage(value: unknown): value is FavoritePage {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data) &&
    value.data.every(
      (favorite: unknown) =>
        typeof favorite === "object" &&
        favorite !== null &&
        "slug" in favorite &&
        typeof favorite.slug === "string",
    ) &&
    "hasMore" in value &&
    typeof value.hasMore === "boolean"
  );
}

export async function fetchSavedHostelSlugs(
  signal: AbortSignal,
): Promise<Set<string>> {
  const slugs = new Set<string>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/favorites?page=${page}&limit=50`,
      { signal },
    );
    const result: unknown = await response.json();

    if (!response.ok) {
      throw new Error(
        readErrorMessage(result) ?? "Could not load your saved hostels.",
      );
    }
    if (!isFavoritePage(result) || (result.hasMore && result.data.length === 0)) {
      throw new Error("Could not load your saved hostels.");
    }

    for (const favorite of result.data) {
      slugs.add(favorite.slug);
    }
    hasMore = result.hasMore;
    page += 1;
  }

  return slugs;
}

export default function ProductHome({
  accountUser,
  cityLinks,
  initialHostels = null,
}: {
  accountUser: BrowseAccountUser | null;
  /** Server-rendered, crawlable links to the city pages. */
  cityLinks?: ReactNode;
  /** Server-rendered listings for the opening tab, or null to load them in the browser. */
  initialHostels?: HostelListing[] | null;
}) {
  const router = useRouter();
  const showsStudentNavigation =
    !accountUser ||
    accountUser.role === "STUDENT";
  const [category, setCategory] = useState<Category>(INITIAL_HOME_CATEGORY);
  const [hostels, setHostels] = useState<HostelListing[]>(initialHostels ?? []);
  const [isLoading, setIsLoading] = useState(initialHostels === null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [favoriteStateReady, setFavoriteStateReady] = useState(
    accountUser?.role !== "STUDENT",
  );
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [favoriteReload, setFavoriteReload] = useState(0);
  const [searchReload, setSearchReload] = useState(0);
  // Which tab (and retry count) the listings on screen answer. A ref that the skip below
  // never changes, so React's development double-run of effects behaves like production.
  const loadedRef = useRef<LoadedResults>(
    initialHostels ? { key: INITIAL_HOME_CATEGORY, reload: 0 } : null,
  );

  useEffect(() => {
    if (isLoadedResultsCurrent(loadedRef.current, category, searchReload)) return;

    const controller = new AbortController();

    async function loadHostels() {
      setIsLoading(true);
      setSearchError(null);

      try {
        const params = buildHomeListingsQuery(category);

        const response = await fetch(`/api/hostels?${params}`, {
          signal: controller.signal,
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          loadedRef.current = null;
          setHostels([]);
          setSearchError(
            readErrorMessage(result) ?? "Unable to load hostels. Please try again.",
          );
          return;
        }
        if (!isHostelSearchResponse(result)) {
          loadedRef.current = null;
          setHostels([]);
          setSearchError("Unable to load hostels. Please try again.");
          return;
        }

        loadedRef.current = { key: category, reload: searchReload };
        setHostels(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        loadedRef.current = null;
        setHostels([]);
        setSearchError("Unable to load hostels. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadHostels();
    return () => controller.abort();
  }, [category, searchReload]);

  useEffect(() => {
    if (accountUser?.role !== "STUDENT") {
      setFavoriteStateReady(true);
      setFavoriteError(null);
      setSavedSlugs(new Set());
      return;
    }

    const controller = new AbortController();

    async function loadFavorites() {
      setFavoriteStateReady(false);
      setFavoriteError(null);

      try {
        const slugs = await fetchSavedHostelSlugs(controller.signal);
        if (!controller.signal.aborted) {
          setSavedSlugs(slugs);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setFavoriteError(
          error instanceof Error
            ? error.message
            : "Could not load your saved hostels.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setFavoriteStateReady(true);
        }
      }
    }

    void loadFavorites();
    return () => controller.abort();
  }, [accountUser?.role, favoriteReload]);

  function openSearch({
    destination,
    moveInDate,
    guests,
    nearby,
  }: HostelSearchFilters): boolean {
    const params = new URLSearchParams();
    if (nearby) {
      try {
        window.sessionStorage.setItem(
          NEARBY_COORDINATES_SESSION_KEY,
          JSON.stringify(nearby),
        );
      } catch {
        return false;
      }
      params.set("nearby", "true");
    } else {
      try {
        window.sessionStorage.removeItem(NEARBY_COORDINATES_SESSION_KEY);
      } catch {
        // A stale nearby coordinate is ignored unless the URL requests nearby search.
      }
      if (destination) params.set("city", destination);
    }
    if (moveInDate) {
      params.set("moveInDate", moveInDate);
      params.set("guests", String(guests));
    }
    const query = params.toString();
    router.push(`/search${query ? `?${query}` : ""}`);
    return true;
  }

  function updateFavorite(slug: string, saved: boolean) {
    setSavedSlugs((current) => {
      const next = new Set(current);
      if (saved) {
        next.add(slug);
      } else {
        next.delete(slug);
      }
      return next;
    });
  }

  const hostelsByCity = new Map<string, HostelListing[]>();
  for (const hostel of hostels) {
    const cityHostels = hostelsByCity.get(hostel.city) ?? [];
    cityHostels.push(hostel);
    hostelsByCity.set(hostel.city, cityHostels);
  }

  return (
    <div
      className="min-h-dvh bg-white text-ink"
      data-account-role={accountUser?.role ?? "GUEST"}
    >
      <BrowseHeader
        accountUser={accountUser}
        category={category}
        onSelectCategory={setCategory}
      />

      <main>
        <h1 className="sr-only">
          Hostels and student stays across Pakistan
        </h1>

        <HostelSearchBar
          destinationSuggestions={[...hostelsByCity.keys()]}
          onSearch={openSearch}
        />
        <div className="mx-auto w-[min(1920px,calc(100%-var(--page-gutter-total)))] [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))]">
          {showsStudentNavigation && (
            <BrowseCategoryNav
              category={category}
              className="hidden [@media(max-width:720px)]:flex"
              onSelectCategory={setCategory}
              variant="mobile"
            />
          )}

          <section
            className={`pt-[39px] pb-[72px] [@media(max-width:720px)]:pt-[18px] ${
              showsStudentNavigation
                ? "[@media(max-width:720px)]:pb-[calc(92px+env(safe-area-inset-bottom))]"
                : ""
            }`}
            aria-label="Hostel listings"
          >
            {isLoading && (
              <div className="flex items-center justify-center py-12" role="status">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <p className="m-0 text-[0.92rem] text-muted">Finding stays…</p>
                </div>
              </div>
            )}
            {searchError && (
              <div className="m-0 py-8 text-[0.92rem] text-muted" role="alert">
                <p className="m-0">{searchError}</p>
                <button
                  className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 font-semibold text-ink"
                  onClick={() => setSearchReload((current) => current + 1)}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}
            {favoriteError && accountUser?.role === "STUDENT" && (
              <p className="mt-2 mb-0 text-[0.8125rem] leading-[1.4] text-[#a12622]" role="alert">
                {favoriteError}{" "}
                <button
                  className="cursor-pointer border-0 bg-transparent p-0 font-bold underline underline-offset-[2px]"
                  onClick={() => setFavoriteReload((current) => current + 1)}
                  type="button"
                >
                  Try again
                </button>
              </p>
            )}
            {!isLoading && !searchError && hostelsByCity.size === 0 && (
              <p className="m-0 py-8 text-[0.92rem] text-muted" role="status">
                No active hostel listings yet.
              </p>
            )}
            {!isLoading &&
              !searchError &&
              Array.from(hostelsByCity, ([city, cityHostels], index) => (
                <HostelRow
                  accountRole={accountUser?.role ?? null}
                  city={city}
                  favoriteError={favoriteError}
                  favoriteStateReady={favoriteStateReady}
                  hostels={cityHostels}
                  isAboveFold={index < 2}
                  key={city}
                  onFavoriteChange={updateFavorite}
                  savedSlugs={savedSlugs}
                />
              ))}
          </section>
          {cityLinks}
        </div>
      </main>
      {showsStudentNavigation && (
        <MobileTabNavigation
          activeTab="explore"
          role={accountUser?.role ?? null}
        />
      )}
    </div>
  );
}
