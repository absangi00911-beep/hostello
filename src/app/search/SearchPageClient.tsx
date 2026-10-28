"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  BrowseAccountActions,
} from "@/components/auth/BrowseAccountActions";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";

interface HostelSearchResult {
  id: string;
  name: string;
  city: string;
  area: string | null;
  pricePerMonth: number;
  coverImage: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
}

interface HostelSearchResponse {
  data: HostelSearchResult[];
  total: number;
  error?: string;
}

const PAGE_SIZE = 20;
const pageFilters = [
  "Women-only",
  "Wi-Fi",
  "Meals included",
  "Laundry",
  "Verified stays",
];
const mapPinPositions = [
  { top: "23%", left: "24%" },
  { top: "39%", left: "69%" },
  { top: "57%", left: "45%" },
  { top: "72%", left: "79%" },
];

function isHostelSearchResult(value: unknown): value is HostelSearchResult {
  if (typeof value !== "object" || value === null) return false;
  return (
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
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data) &&
    value.data.every(isHostelSearchResult) &&
    "total" in value &&
    typeof value.total === "number" &&
    Number.isSafeInteger(value.total) &&
    value.total >= value.data.length
  );
}

function MapPreview({
  city,
  hostels,
}: {
  city: string;
  hostels: HostelSearchResult[];
}) {
  const mapHostels = hostels.slice(0, mapPinPositions.length);

  return (
    <aside
      aria-label="Map preview"
      className="search-map-preview"
      role="region"
    >
      <div className="search-map-art" aria-hidden="true">
        <svg
          className="search-map-streets"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 640 860"
        >
          <path d="M-30 170 205 75l180 40 310-140M-20 440l190-80 210 45 280-150M-50 730l250-140 190 35 270-190M115-30l30 220-65 155 110 190-70 350M390-40l-25 210 95 185-30 200 95 320M570-20l-75 180 65 175-40 220 65 250" />
          <path d="m-20 290 160 55 95-115 150 55 125-95 165 40M-40 610l185-65 125 90 125-55 145 65 135-70M275-20l-25 185 70 145-60 210 80 165-15 175" />
        </svg>
        <span className="search-map-area search-map-area-one">Gulberg</span>
        <span className="search-map-area search-map-area-two">Model Town</span>
        <span className="search-map-area search-map-area-three">Garden Town</span>
      </div>
      <span className="search-map-label">{city || "Pakistan"} · Map preview</span>
      {mapHostels.map((hostel, index) => (
        <span
          className="search-map-price"
          key={hostel.id}
          style={mapPinPositions[index]}
        >
          PKR {(hostel.pricePerMonth / 1000).toFixed(0)}k
        </span>
      ))}
      <div className="search-map-attribution">Illustrative map preview</div>
    </aside>
  );
}

function HostelCard({
  hostel,
  priority,
}: {
  hostel: HostelSearchResult;
  priority: boolean;
}) {
  const image = hostel.coverImage || hostel.images[0];

  return (
    <Link
      aria-label={`View details for ${hostel.name}`}
      className="search-result-card hostel-card-link"
      href={`/hostels/${hostel.id}`}
    >
      <div className="search-result-image">
        {image ? (
          <Image
            alt={hostel.name}
            className="hostel-card-photo"
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 720px) 90vw, (max-width: 1100px) 35vw, 25vw"
            src={image}
          />
        ) : (
          <div
            aria-label={`No photo available for ${hostel.name}`}
            className="search-result-image-fallback"
            role="img"
          />
        )}
      </div>
      <div className="search-result-details">
        <div className="search-result-title-row">
          <h2 title={hostel.name}>{hostel.name}</h2>
          <span
            aria-label={
              hostel.reviewCount > 0
                ? `Rated ${hostel.rating.toFixed(1)} out of 5`
                : "No ratings yet"
            }
            className="search-result-rating"
            role="img"
          >
            {hostel.reviewCount > 0 ? (
              <>
                <Star aria-hidden="true" fill="currentColor" size={14} />
                {hostel.rating.toFixed(1)}
              </>
            ) : (
              "New"
            )}
          </span>
        </div>
        <p className="search-result-area">
          {hostel.area || hostel.city}, {hostel.city}
        </p>
        <p className="search-result-price">
          <strong>PKR {hostel.pricePerMonth.toLocaleString("en-PK")}</strong>
          <span> / month</span>
        </p>
      </div>
    </Link>
  );
}

export default function SearchPageClient({
  accountUser,
  initialCity,
}: {
  accountUser: BrowseAccountUser | null;
  initialCity: string;
}) {
  const [destination, setDestination] = useState(initialCity);
  const [appliedCity, setAppliedCity] = useState(initialCity);
  const [hostels, setHostels] = useState<HostelSearchResult[]>([]);
  const [totalHostels, setTotalHostels] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(totalHostels / PAGE_SIZE));

  useEffect(() => {
    const controller = new AbortController();

    async function loadHostels() {
      setIsLoading(true);
      setSearchError(null);
      const query = new URLSearchParams({
        sort: "newest",
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (appliedCity) query.set("city", appliedCity);

      try {
        const response = await fetch(`/api/hostels?${query}`, {
          signal: controller.signal,
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          setHostels([]);
          setTotalHostels(0);
          setSearchError(
            typeof result === "object" &&
              result !== null &&
              "error" in result &&
              typeof result.error === "string"
              ? result.error
              : "Unable to load hostels. Please try again.",
          );
          return;
        }
        if (!isHostelSearchResponse(result)) {
          setHostels([]);
          setTotalHostels(0);
          setSearchError("Unable to load hostels. Please try again.");
          return;
        }

        setHostels(result.data);
        setTotalHostels(result.total);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setHostels([]);
        setTotalHostels(0);
        setSearchError("Unable to load hostels. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadHostels();
    return () => controller.abort();
  }, [appliedCity, page]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedCity(destination.trim());
  }

  function selectPage(nextPage: number) {
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pageTitle = appliedCity
    ? `Hostels in ${appliedCity}`
    : "Hostels across Pakistan";

  return (
    <div className="search-results-page">
      <header className="search-results-header">
        <div className="search-results-header-inner">
          <Link className="browse-brand" href="/" aria-label="hostello home">
            <span>hostello</span>
          </Link>

          <form
            className="search-compact-form"
            onSubmit={submitSearch}
            role="search"
          >
            <label className="search-compact-location">
              <span>Where</span>
              <input
                aria-label="Search destination"
                autoComplete="off"
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Search any city"
                type="search"
                value={destination}
              />
            </label>
            <div className="search-compact-static">
              <span>Move-in</span>
              <span>Add dates</span>
            </div>
            <div className="search-compact-static">
              <span>Residents</span>
              <span>Add residents</span>
            </div>
            <button
              aria-label="Search hostels"
              className="search-compact-submit"
              type="submit"
            >
              <Search aria-hidden="true" size={17} />
            </button>
          </form>

          <BrowseAccountActions user={accountUser} />
        </div>
      </header>

      <div className="search-filter-bar">
        <div className="search-filter-inner">
          <div className="search-filter-list" aria-label="Hostel filters">
            <span className="search-filter-control">
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filters
            </span>
            {pageFilters.map((filter) => (
              <span className="search-filter-chip" key={filter}>
                {filter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="search-results-main">
        <div className="search-results-layout">
          <section aria-label="Hostel listings" className="search-results-content">
            <div className="search-results-heading">
              <h1>{pageTitle}</h1>
              {!isLoading && !searchError && totalHostels > 0 && (
                <p>
                  {totalHostels} {totalHostels === 1 ? "hostel" : "hostels"}
                  {appliedCity ? ` in ${appliedCity}` : ""}
                </p>
              )}
            </div>

            <p className="search-price-note">
              Prices include monthly rent
            </p>

            {isLoading && (
              <p className="search-results-message" role="status">
                Finding hostels…
              </p>
            )}
            {searchError && (
              <p className="search-results-message" role="alert">
                {searchError}
              </p>
            )}
            {!isLoading && !searchError && hostels.length === 0 && (
              <p className="search-results-message" role="status">
                {appliedCity
                  ? `No hostels found in ${appliedCity} yet.`
                  : "No active hostel listings yet."}
              </p>
            )}
            {!isLoading && !searchError && hostels.length > 0 && (
              <>
                <div className="search-result-grid">
                  {hostels.map((hostel, index) => (
                    <HostelCard
                      hostel={hostel}
                      key={hostel.id}
                      priority={index < 2}
                    />
                  ))}
                </div>
                <nav
                  aria-label="Listing pages"
                  className="search-pagination"
                >
                  <button
                    aria-label="Previous page"
                    disabled={page === 1}
                    onClick={() => selectPage(page - 1)}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                  </button>
                  {Array.from(
                    { length: Math.min(pageCount, 5) },
                    (_, index) => index + 1,
                  ).map((pageNumber) => (
                    <button
                      aria-current={pageNumber === page ? "page" : undefined}
                      aria-label={`Page ${pageNumber}`}
                      className={
                        pageNumber === page ? "is-current" : undefined
                      }
                      key={pageNumber}
                      onClick={() => selectPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ))}
                  {pageCount > 5 && (
                    <>
                      <span aria-hidden="true">…</span>
                      <button
                        aria-current={page === pageCount ? "page" : undefined}
                        aria-label={`Page ${pageCount}`}
                        className={page === pageCount ? "is-current" : undefined}
                        onClick={() => selectPage(pageCount)}
                        type="button"
                      >
                        {pageCount}
                      </button>
                    </>
                  )}
                  <button
                    aria-label="Next page"
                    disabled={page === pageCount}
                    onClick={() => selectPage(page + 1)}
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" size={17} />
                  </button>
                </nav>
              </>
            )}
          </section>

          <MapPreview city={appliedCity} hostels={hostels} />
        </div>
      </main>

      <footer className="search-results-footer">
        <div className="search-footer-columns">
          <div>
            <h2>Support</h2>
            <Link href="/messages">Contact HostelLo</Link>
            <Link href="/search">Browse hostels</Link>
          </div>
          <div>
            <h2>For students</h2>
            <Link href="/search">Find a hostel</Link>
            <Link href="/">Explore HostelLo</Link>
          </div>
          <div>
            <h2>For hostel owners</h2>
            <Link href="/signup?role=OWNER">List your hostel</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
        <div className="search-footer-bottom">
          <span>© {new Date().getFullYear()} HostelLo</span>
          <span>Made for student stays in Pakistan</span>
        </div>
      </footer>
    </div>
  );
}
