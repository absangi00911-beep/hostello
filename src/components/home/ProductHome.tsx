"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { BrowseHeader, type Category } from "./BrowseHeader";
import { BrowseCategoryNav } from "./BrowseCategoryNav";
import { HostelSearchBar } from "./HostelSearchBar";
import { HostelRow, type HostelListing } from "./HostelRow";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";

interface HostelSearchResponse {
  data: HostelListing[];
  total: number;
  error?: string;
}

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

function isHostelListing(value: unknown): value is HostelListing {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "city" in value &&
    typeof value.city === "string" &&
    "area" in value &&
    (typeof value.area === "string" || value.area === null) &&
    "pricePerMonth" in value &&
    typeof value.pricePerMonth === "number" &&
    "coverImage" in value &&
    (typeof value.coverImage === "string" || value.coverImage === null) &&
    "images" in value &&
    Array.isArray(value.images) &&
    value.images.every((image: unknown) => typeof image === "string") &&
    "rating" in value &&
    typeof value.rating === "number" &&
    "reviewCount" in value &&
    typeof value.reviewCount === "number"
  );
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

function isHostelSearchResponse(value: unknown): value is HostelSearchResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    !("total" in value)
  ) {
    return false;
  }

  return (
    Array.isArray(value.data) &&
    typeof value.total === "number" &&
    Number.isSafeInteger(value.total) &&
    value.total >= value.data.length &&
    value.data.every(isHostelListing)
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
}: {
  accountUser: BrowseAccountUser | null;
}) {
  const router = useRouter();
  const showsStudentNavigation =
    !accountUser ||
    accountUser.role === "STUDENT";
  const [category, setCategory] = useState<Category>("all");
  const [hostels, setHostels] = useState<HostelListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [favoriteStateReady, setFavoriteStateReady] = useState(
    accountUser?.role !== "STUDENT",
  );
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [favoriteReload, setFavoriteReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHostels() {
      setIsLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          sort: category === "top-rated" ? "rating" : "newest",
          page: "1",
          limit: "50",
        });
        if (category === "women") params.set("gender", "FEMALE");
        if (category === "budget") params.set("maxPrice", "20000");

        const response = await fetch(`/api/hostels?${params}`, {
          signal: controller.signal,
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          setHostels([]);
          setSearchError(
            readErrorMessage(result) ?? "Unable to load hostels. Please try again.",
          );
          return;
        }
        if (!isHostelSearchResponse(result)) {
          setHostels([]);
          setSearchError("Unable to load hostels. Please try again.");
          return;
        }

        setHostels(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setHostels([]);
        setSearchError("Unable to load hostels. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadHostels();
    return () => controller.abort();
  }, [category]);

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

  function openSearch(destination: string) {
    const query = destination
      ? `?${new URLSearchParams({ city: destination })}`
      : "";
    router.push(`/search${query}`);
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
        <div className="mx-auto w-[min(1920px,calc(100%-64px))] [@media(max-width:960px)]:w-[min(100%-32px,1344px)] [@media(max-width:720px)]:w-[min(100%-40px,600px)] [@media(max-width:420px)]:w-[calc(100%-40px)]">
          <h1 className="sr-only">
            Hostels and student stays across Pakistan
          </h1>

          <HostelSearchBar onSearch={openSearch} />
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
              <p className="m-0 py-8 text-[0.92rem] text-muted" role="alert">
                {searchError}
              </p>
            )}
            {favoriteError && accountUser?.role === "STUDENT" && (
              <p className="mt-2 mb-0 text-[0.78rem] leading-[1.4] text-[#a12622]" role="alert">
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
        </div>
      </main>
      {showsStudentNavigation && (
        <MobileTabNavigation activeTab="explore" />
      )}
    </div>
  );
}
