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
import { hostelCardImageClassName } from "@/components/hostel-card-styles";

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
      className="search-map-preview sticky top-[164px] min-h-[min(720px,calc(100svh-190px))] isolate overflow-hidden rounded-[14px] border border-[#dfe3d8] bg-[#e7eddc] [@media(max-width:780px)]:hidden"
      role="region"
    >
      <div
        aria-hidden="true"
        className="search-map-art absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_75%_22%,#d2e3bf_0_11%,transparent_11.5%),radial-gradient(ellipse_at_24%_72%,#d3e2c4_0_13%,transparent_13.5%),linear-gradient(135deg,#f1f0df_0%,#e6eddb_52%,#e7eadb_100%)]"
      >
        <svg
          className="search-map-streets absolute inset-[-7%_-14%] h-[115%] w-[128%] [stroke-linecap:round] [stroke-width:11] [stroke:#fff]"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 640 860"
        >
          <path d="M-30 170 205 75l180 40 310-140M-20 440l190-80 210 45 280-150M-50 730l250-140 190 35 270-190M115-30l30 220-65 155 110 190-70 350M390-40l-25 210 95 185-30 200 95 320M570-20l-75 180 65 175-40 220 65 250" />
          <path
            className="[stroke:#d3d9cd] [stroke-width:2]"
            d="m-20 290 160 55 95-115 150 55 125-95 165 40M-40 610l185-65 125 90 125-55 145 65 135-70M275-20l-25 185 70 145-60 210 80 165-15 175"
          />
        </svg>
        <span className="search-map-area absolute top-[28%] left-[16%] text-[0.72rem] tracking-[0.02em] text-[#737d70]">
          Gulberg
        </span>
        <span className="search-map-area absolute top-[63%] left-[54%] text-[0.72rem] tracking-[0.02em] text-[#737d70]">
          Model Town
        </span>
        <span className="search-map-area absolute top-[78%] left-[17%] text-[0.72rem] tracking-[0.02em] text-[#737d70]">
          Garden Town
        </span>
      </div>
      <span className="search-map-label absolute top-4 left-4 z-[2] rounded-full border border-[rgb(29_42_34_/_8%)] bg-white/[0.92] px-3 py-2 text-[0.75rem] font-semibold text-ink shadow-[0_2px_8px_rgb(29_42_34_/_10%)]">
        {city || "Pakistan"} · Map preview
      </span>
      {mapHostels.map((hostel, index) => (
        <span
          className="search-map-price absolute z-[2] rounded-full border border-[rgb(29_42_34_/_12%)] bg-white px-[10px] py-[7px] text-[0.72rem] font-bold text-ink shadow-[0_2px_7px_rgb(29_42_34_/_18%)] whitespace-nowrap"
          key={hostel.id}
          style={mapPinPositions[index]}
        >
          PKR {(hostel.pricePerMonth / 1000).toFixed(0)}k
        </span>
      ))}
      <div className="search-map-attribution absolute right-0 bottom-0 left-0 bg-white/[0.82] px-[11px] py-[7px] text-right text-[0.65rem] text-[#586358]">
        Illustrative map preview
      </div>
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
      className="search-result-card hostel-card-link group block min-w-0 rounded-xl text-inherit"
      href={`/hostels/${hostel.id}`}
    >
      <div className="search-result-image relative aspect-[1.28] overflow-hidden rounded-xl bg-surface-muted [@media(max-width:520px)]:aspect-[1.35]">
        {image ? (
          <Image
            alt={hostel.name}
            className={hostelCardImageClassName}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 720px) 90vw, (max-width: 1100px) 35vw, 25vw"
            src={image}
          />
        ) : (
          <div
            aria-label={`No photo available for ${hostel.name}`}
            className="search-result-image-fallback size-full bg-brand-soft bg-[linear-gradient(135deg,transparent_40%,rgb(47_101_73_/_16%))]"
            role="img"
          />
        )}
      </div>
      <div className="search-result-details pt-[9px]">
        <div className="search-result-title-row flex items-baseline justify-between gap-2">
          <h2
            className="m-0 overflow-hidden text-[0.84rem] font-semibold leading-[1.35] tracking-[-0.01em] text-ellipsis whitespace-nowrap"
            title={hostel.name}
          >
            {hostel.name}
          </h2>
          <span
            aria-label={
              hostel.reviewCount > 0
                ? `Rated ${hostel.rating.toFixed(1)} out of 5`
                : "No ratings yet"
            }
            className="search-result-rating inline-flex shrink-0 items-center gap-1 text-[0.72rem] font-semibold text-ink"
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
        <p className="search-result-area mt-[3px] mb-0 overflow-hidden text-[0.75rem] text-muted text-ellipsis whitespace-nowrap">
          {hostel.area || hostel.city}, {hostel.city}
        </p>
        <p className="search-result-price mt-2 mb-0 text-[0.78rem]">
          <strong className="font-[650]">
            PKR {hostel.pricePerMonth.toLocaleString("en-PK")}
          </strong>
          <span className="text-muted"> / month</span>
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
    <div className="search-results-page min-h-dvh bg-white text-ink">
      <header className="search-results-header sticky top-0 z-20 border-b border-line bg-white/[0.96] backdrop-blur-[12px]">
        <div className="search-results-header-inner mx-auto grid w-[min(1920px,calc(100%-64px))] min-h-[82px] grid-cols-[minmax(0,1fr)_minmax(360px,620px)_minmax(0,1fr)] items-center gap-6 [@media(max-width:1020px)]:grid-cols-[minmax(0,1fr)_minmax(340px,1.5fr)_auto] [@media(max-width:1020px)]:gap-[14px] [@media(max-width:960px)]:w-[min(100%-32px,1344px)] [@media(max-width:720px)]:w-[calc(100%-40px)]! [@media(max-width:780px)]:min-h-[70px] [@media(max-width:780px)]:grid-cols-[minmax(0,1fr)_auto] [@media(max-width:780px)]:[&_.browse-account-actions]:col-start-2 [@media(max-width:780px)]:[&_.browse-account-actions]:row-start-1 [&_.browse-account-actions]:whitespace-nowrap [@media(max-width:1020px)]:[&_.browse-host-link]:hidden">
          <Link className="browse-brand" href="/" aria-label="hostello home">
            <span>hostello</span>
          </Link>

          <form
            className="search-compact-form grid min-h-[54px] grid-cols-[minmax(120px,1.35fr)_minmax(96px,0.9fr)_minmax(110px,1fr)_40px] items-center rounded-full border border-line bg-white p-[5px] shadow-[0_2px_8px_rgb(29_42_34_/_8%)] [@media(max-width:780px)]:col-span-full [@media(max-width:780px)]:col-start-1 [@media(max-width:780px)]:row-start-2 [@media(max-width:780px)]:mb-3 [@media(max-width:520px)]:min-h-[50px] [@media(max-width:520px)]:grid-cols-[minmax(100px,1.2fr)_minmax(80px,0.8fr)_38px]"
            onSubmit={submitSearch}
            role="search"
          >
            <label className="search-compact-location flex min-h-[36px] min-w-0 flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:520px)]:px-[10px]">
              <span className="text-[0.68rem] leading-[1.25] font-bold text-ink">
                Where
              </span>
              <input
                aria-label="Search destination"
                autoComplete="off"
                className="w-full min-w-0 border-0 bg-transparent p-0 text-[0.75rem] leading-[1.4] text-muted outline-none placeholder:text-muted placeholder:opacity-100"
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Search any city"
                type="search"
                value={destination}
              />
            </label>
            <div className="search-compact-static flex min-h-[36px] min-w-0 flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:520px)]:px-[10px]">
              <span className="text-[0.68rem] leading-[1.25] font-bold text-ink">
                Move-in
              </span>
              <span className="overflow-hidden text-[0.74rem] text-muted text-ellipsis whitespace-nowrap">
                Add dates
              </span>
            </div>
            <div className="search-compact-static flex min-h-[36px] min-w-0 flex-col justify-center gap-px border-r border-line px-[14px] [@media(max-width:520px)]:hidden [@media(max-width:520px)]:px-[10px]">
              <span className="text-[0.68rem] leading-[1.25] font-bold text-ink">
                Residents
              </span>
              <span className="overflow-hidden text-[0.74rem] text-muted text-ellipsis whitespace-nowrap">
                Add residents
              </span>
            </div>
            <button
              aria-label="Search hostels"
              className="search-compact-submit grid size-[38px] cursor-pointer place-items-center rounded-full border-0 bg-brand text-white transition-colors duration-[160ms] hover:bg-brand-dark [@media(max-width:520px)]:size-9"
              type="submit"
            >
              <Search aria-hidden="true" size={17} />
            </button>
          </form>

          <BrowseAccountActions user={accountUser} />
        </div>
      </header>

      <div className="search-filter-bar sticky top-[82px] z-[15] border-b border-line bg-white/[0.97] [@media(max-width:780px)]:top-[133px]">
        <div className="search-filter-inner mx-auto w-[min(1920px,calc(100%-64px))] [@media(max-width:960px)]:w-[min(100%-32px,1344px)] [@media(max-width:720px)]:w-[calc(100%-40px)]!">
          <div
            aria-label="Hostel filters"
            className="search-filter-list flex min-h-[66px] items-center gap-[10px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-width:780px)]:min-h-[58px]"
          >
            <span className="search-filter-control inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-white px-[15px] text-[0.77rem] font-[550] text-ink whitespace-nowrap">
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filters
            </span>
            {pageFilters.map((filter) => (
              <span
                className="search-filter-chip inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-white px-[15px] text-[0.77rem] font-[550] text-ink whitespace-nowrap"
                key={filter}
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="search-results-main mx-auto w-[min(1920px,calc(100%-64px))] pt-[30px] pb-16 [@media(max-width:960px)]:w-[min(100%-32px,1344px)] [@media(max-width:720px)]:w-[calc(100%-40px)]! [@media(max-width:780px)]:pt-6">
        <div className="search-results-layout grid grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)] items-start gap-[clamp(24px,3vw,42px)] [@media(max-width:1020px)]:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.85fr)] [@media(max-width:1020px)]:gap-[22px] [@media(max-width:780px)]:grid-cols-[minmax(0,1fr)]">
          <section
            aria-label="Hostel listings"
            className="search-results-content min-w-0"
          >
            <div className="search-results-heading mb-[6px] flex items-baseline justify-between gap-[18px] [@media(max-width:520px)]:items-start [@media(max-width:520px)]:flex-col [@media(max-width:520px)]:gap-1">
              <h1 className="m-0 text-[clamp(1.2rem,1.55vw,1.48rem)] leading-[1.3] font-[650] tracking-[-0.035em]">
                {pageTitle}
              </h1>
              {!isLoading && !searchError && totalHostels > 0 && (
                <p className="m-0 flex-none text-[0.82rem] text-muted">
                  {totalHostels} {totalHostels === 1 ? "hostel" : "hostels"}
                  {appliedCity ? ` in ${appliedCity}` : ""}
                </p>
              )}
            </div>

            <p className="search-price-note mt-0 mb-[18px] text-[0.76rem] text-muted">
              Prices include monthly rent
            </p>

            {isLoading && (
              <p
                className="search-results-message m-0 py-[30px] text-[0.9rem] text-muted"
                role="status"
              >
                Finding hostels…
              </p>
            )}
            {searchError && (
              <p
                className="search-results-message m-0 py-[30px] text-[0.9rem] text-muted"
                role="alert"
              >
                {searchError}
              </p>
            )}
            {!isLoading && !searchError && hostels.length === 0 && (
              <p
                className="search-results-message m-0 py-[30px] text-[0.9rem] text-muted"
                role="status"
              >
                {appliedCity
                  ? `No hostels found in ${appliedCity} yet.`
                  : "No active hostel listings yet."}
              </p>
            )}
            {!isLoading && !searchError && hostels.length > 0 && (
              <>
                <div className="search-result-grid grid grid-cols-2 gap-x-[18px] gap-y-6 [@media(max-width:520px)]:grid-cols-[minmax(0,1fr)] [@media(max-width:520px)]:gap-y-[22px]">
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
                  className="search-pagination mt-[42px] flex items-center justify-center gap-2"
                >
                  <button
                    aria-label="Previous page"
                    className="grid size-[34px] min-w-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent px-[9px] text-[0.78rem] text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-[#a0a9a2] motion-reduce:scroll-auto motion-reduce:transition-none"
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
                      className={`grid size-[34px] min-w-[34px] cursor-pointer place-items-center rounded-full border-0 px-[9px] text-[0.78rem] motion-reduce:scroll-auto motion-reduce:transition-none ${
                        pageNumber === page
                          ? "bg-ink text-white"
                          : "bg-transparent text-ink hover:bg-surface-muted"
                      }`}
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
                        className={`grid size-[34px] min-w-[34px] cursor-pointer place-items-center rounded-full border-0 px-[9px] text-[0.78rem] motion-reduce:scroll-auto motion-reduce:transition-none ${
                          page === pageCount
                            ? "bg-ink text-white"
                            : "bg-transparent text-ink hover:bg-surface-muted"
                        }`}
                        onClick={() => selectPage(pageCount)}
                        type="button"
                      >
                        {pageCount}
                      </button>
                    </>
                  )}
                  <button
                    aria-label="Next page"
                    className="grid size-[34px] min-w-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent px-[9px] text-[0.78rem] text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-[#a0a9a2] motion-reduce:scroll-auto motion-reduce:transition-none"
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

      <footer className="search-results-footer border-t border-line bg-[#f7f7f5] pt-[34px] pr-[max(32px,calc((100%-1440px)/2))] pb-[18px] pl-[max(32px,calc((100%-1440px)/2))] [@media(max-width:780px)]:px-5 [@media(max-width:520px)]:px-4">
        <div className="search-footer-columns grid grid-cols-3 gap-[30px] pb-[30px] [@media(max-width:520px)]:grid-cols-2 [@media(max-width:520px)]:gap-x-4 [@media(max-width:520px)]:gap-y-6">
          <div className="flex flex-col items-start gap-[10px]">
            <h2 className="m-0 mb-[2px] text-[0.82rem] font-bold">Support</h2>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/messages">Contact HostelLo</Link>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/search">Browse hostels</Link>
          </div>
          <div className="flex flex-col items-start gap-[10px]">
            <h2 className="m-0 mb-[2px] text-[0.82rem] font-bold">For students</h2>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/search">Find a hostel</Link>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/">Explore HostelLo</Link>
          </div>
          <div className="flex flex-col items-start gap-[10px]">
            <h2 className="m-0 mb-[2px] text-[0.82rem] font-bold">For hostel owners</h2>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/signup?role=OWNER">List your hostel</Link>
            <Link className="text-[0.74rem] text-[#566158] hover:text-ink hover:underline hover:underline-offset-[3px]" href="/login">Sign in</Link>
          </div>
        </div>
        <div className="search-footer-bottom flex justify-between gap-[18px] border-t border-line pt-[17px] text-[0.74rem] text-[#566158] [@media(max-width:520px)]:flex-col [@media(max-width:520px)]:gap-[6px]">
          <span>© {new Date().getFullYear()} HostelLo</span>
          <span>Made for student stays in Pakistan</span>
        </div>
      </footer>
    </div>
  );
}
