"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { BrowseHeader, type Category } from "./BrowseHeader";
import { HostelSearchBar } from "./HostelSearchBar";
import { HostelRow, type HostelListing } from "./HostelRow";

interface HostelSearchResponse {
  data: HostelListing[];
  total: number;
  error?: string;
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

export default function ProductHome({
  accountUser,
}: {
  accountUser: BrowseAccountUser | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("all");
  const [hostels, setHostels] = useState<HostelListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  function openSearch(destination: string) {
    const query = destination
      ? `?${new URLSearchParams({ city: destination })}`
      : "";
    router.push(`/search${query}`);
  }

  const hostelsByCity = new Map<string, HostelListing[]>();
  for (const hostel of hostels) {
    const cityHostels = hostelsByCity.get(hostel.city) ?? [];
    cityHostels.push(hostel);
    hostelsByCity.set(hostel.city, cityHostels);
  }

  return (
    <div className="browse-home">
      <BrowseHeader
        accountUser={accountUser}
        category={category}
        onSelectCategory={setCategory}
      />

      <main className="browse-main">
        <div className="browse-shell">
          <h1 className="browse-visually-hidden">
            Hostels and student stays across Pakistan
          </h1>

          <HostelSearchBar onSearch={openSearch} />

          <section className="browse-listings" aria-label="Hostel listings">
            {isLoading && (
              <p className="browse-state" role="status">
                Finding stays…
              </p>
            )}
            {searchError && (
              <p className="browse-state" role="alert">
                {searchError}
              </p>
            )}
            {!isLoading && !searchError && hostelsByCity.size === 0 && (
              <p className="browse-state" role="status">
                No active hostel listings yet.
              </p>
            )}
            {!isLoading &&
              !searchError &&
              Array.from(hostelsByCity, ([city, cityHostels], index) => (
                <HostelRow
                  city={city}
                  hostels={cityHostels}
                  isAboveFold={index < 2}
                  key={city}
                />
              ))}
          </section>
        </div>
      </main>
    </div>
  );
}
