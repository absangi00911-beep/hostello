"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Star,
} from "@/components/icons/HostelloIcons";
import { useRef, useState } from "react";
import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { hostelCardImageClassName } from "@/components/hostel-card-styles";
import { HostelCardImage } from "@/components/HostelCardImage";
import { getScrollBehavior } from "@/lib/scroll-behavior";

export interface HostelListing {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string | null;
  pricePerMonth: number;
  coverImage: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
}

const favoriteButtonClassName =
  "hostel-favorite-button absolute top-0 right-0 z-[2] grid size-[clamp(2.75rem,26cqw,3.25rem)] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-white no-underline transition-transform duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04] active:scale-[0.92] aria-pressed:text-brand-dark disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[3px]! motion-reduce:hover:scale-100! motion-reduce:active:scale-100! motion-reduce:hover:transform-none! motion-reduce:active:transform-none!";

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

function isFavoriteResult(value: unknown): value is { saved: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "saved" in value &&
    typeof value.saved === "boolean"
  );
}

function HostelFavoriteControl({
  hostel,
  accountRole,
  isSaved,
  favoriteStateReady,
  favoriteError,
  onFavoriteChange,
}: {
  hostel: HostelListing;
  accountRole: BrowseAccountUser["role"] | null;
  isSaved: boolean;
  favoriteStateReady: boolean;
  favoriteError: string | null;
  onFavoriteChange: (slug: string, saved: boolean) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  if (accountRole === "OWNER" || accountRole === "ADMIN") return null;

  if (!accountRole) {
    return (
      <LoginDialogTrigger
        ariaLabel={`Sign in to save ${hostel.name} to Wishlists`}
        className={favoriteButtonClassName}
      >
        <Heart
          aria-hidden="true"
          className="size-[clamp(1.25rem,12cqw,1.5rem)] drop-shadow-[0_1px_2px_rgb(0_0_0/85%)]"
          fill="black"
          fillOpacity={0.5}
          stroke="white"
          strokeWidth={1.5}
        />
      </LoginDialogTrigger>
    );
  }

  async function toggleFavorite() {
    setIsSaving(true);
    setMessage(null);
    setIsError(false);
    setRequiresSignIn(false);

    try {
      const response = await fetch(
        `/api/hostels/${encodeURIComponent(hostel.slug)}/favorite`,
        { method: isSaved ? "DELETE" : "POST" },
      );
      const result: unknown = await response.json();

      if (!response.ok) {
        setIsError(true);
        setRequiresSignIn(response.status === 401);
        setMessage(
          response.status === 401
            ? "Sign in to save this hostel."
            : readErrorMessage(result) ??
                "Could not update your saved hostels. Please try again.",
        );
        return;
      }

      if (!isFavoriteResult(result)) {
        setIsError(true);
        setMessage("Could not confirm the saved-hostel update.");
        return;
      }

      onFavoriteChange(hostel.slug, result.saved);
      setMessage(result.saved ? "Hostel saved." : "Hostel removed from saved.");
    } catch {
      setIsError(true);
      setMessage("Could not update your saved hostels. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        aria-label={
          isSaved
            ? `Remove ${hostel.name} from Wishlists`
            : `Save ${hostel.name} to Wishlists`
        }
        aria-pressed={isSaved}
        className={favoriteButtonClassName}
        disabled={isSaving || !favoriteStateReady || Boolean(favoriteError)}
        onClick={() => void toggleFavorite()}
        type="button"
      >
        <Heart
          aria-hidden="true"
          className="size-[clamp(1.25rem,12cqw,1.5rem)] drop-shadow-[0_1px_2px_rgb(0_0_0/85%)]"
          fill={isSaved ? "currentColor" : "black"}
          fillOpacity={isSaved ? 1 : 0.5}
          stroke={isSaved ? "currentColor" : "white"}
          strokeWidth={1.5}
        />
      </button>
      {message && (
        <p
          className={`hostel-favorite-feedback mt-2 mb-0 text-label leading-[1.4] ${
            isError ? "text-danger" : "text-muted"
          }`}
          role={isError ? "alert" : "status"}
        >
          {message}
          {requiresSignIn && (
            <>
              {" "}
              <LoginDialogTrigger className="focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[3px]!">
                Sign in
              </LoginDialogTrigger>
            </>
          )}
        </p>
      )}
    </>
  );
}

// A row scrolls sideways: a phone shows about two and a half cards (40vw each), a desktop
// about seven. Loading ten per row eagerly queued images nobody could see yet behind the
// ones that decide how fast the page looks ready; the rest load as the row is scrolled.
const EAGER_CARD_IMAGES = 4;

export function HostelRow({
  city,
  hostels,
  isAboveFold,
  accountRole,
  savedSlugs,
  favoriteStateReady,
  favoriteError,
  onFavoriteChange,
}: {
  city: string;
  hostels: HostelListing[];
  isAboveFold: boolean;
  accountRole: BrowseAccountUser["role"] | null;
  savedSlugs: ReadonlySet<string>;
  favoriteStateReady: boolean;
  favoriteError: string | null;
  onFavoriteChange: (slug: string, saved: boolean) => void;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: -1 | 1) {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.85,
      behavior: getScrollBehavior(),
    });
  }

  return (
    <section className="mb-7" aria-labelledby={`stays-${city}`}>
      <div className="mb-3 flex items-center justify-between gap-[18px]">
        <h2 className="m-0 min-w-0 text-title font-bold leading-[1.43] tracking-0" id={`stays-${city}`}>
          Stays in {city}
        </h2>
        <div className="flex flex-[0_0_auto] gap-2">
          <button
            aria-label={`Scroll ${city} listings left`}
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-ink hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 btn-secondary"
            onClick={() => scrollCarousel(-1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Scroll ${city} listings right`}
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-ink hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 btn-secondary"
            onClick={() => scrollCarousel(1)}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div
        className="hostel-carousel grid grid-flow-col auto-cols-[calc(14.085%_-_13.8px)] gap-[14px] overflow-x-auto overscroll-x-contain px-2 pb-[10px] [scroll-padding-inline:8px] snap-x snap-mandatory [scrollbar-width:none] [@media(min-width:721px)_and_(max-width:1100px)]:auto-cols-[calc(24.39%_-_11.71px)] [@media(min-width:721px)_and_(max-width:1100px)]:gap-3 [@media(max-width:720px)]:auto-cols-[calc(50%_-_5px)] [@media(max-width:720px)]:gap-3 [@media(max-width:720px)]:ml-[-20px] [@media(max-width:720px)]:mr-[-20px] [@media(max-width:720px)]:px-0 [@media(max-width:720px)]:pl-[calc(4.545%_+_12.18px)] [@media(max-width:720px)]:pr-[calc(4.545%_+_12.18px)] [@media(max-width:720px)]:[scroll-padding-inline:calc(4.545%_+_10.36px)]"
        ref={carouselRef}
        role="region"
        aria-label={`Hostel listings in ${city}`}
        tabIndex={0}
      >
        {hostels.map((hostel, index) => {
          const image = hostel.coverImage || hostel.images[0];

          return (
            <article
              className="hostel-card @container/hostel-card relative min-w-0 snap-start overflow-visible border-0 rounded-none bg-transparent"
              key={hostel.id}
            >
              <Link
                aria-labelledby={`hostel-title-${hostel.id}`}
                className="hostel-card-link group block min-w-0 rounded-[16px] text-inherit transition-transform duration-[160ms] active:scale-[0.99] motion-reduce:active:transform-none!"
                href={`/hostels/${hostel.id}`}
              >
                <div className="hostel-card-image relative aspect-[1.05] overflow-hidden rounded-[16px] bg-brand-soft">
                  <HostelCardImage
                    alt={hostel.name}
                    className={hostelCardImageClassName}
                    loading={isAboveFold && index < EAGER_CARD_IMAGES ? "eager" : "lazy"}
                    sizes="(max-width: 720px) 40vw, (max-width: 1100px) 23vw, 12vw"
                    src={image}
                  />
                </div>
                <div className="hostel-card-details px-[2px] pt-2 pb-1 [@media(max-width:720px)]:px-0">
                  <h3
                    className="m-0 mb-[3px] overflow-hidden text-label font-semibold leading-[1.25] tracking-normal text-ellipsis whitespace-nowrap [@media(max-width:720px)]:line-clamp-2 [@media(max-width:720px)]:min-h-[2.5em] [@media(max-width:720px)]:whitespace-normal [@media(max-width:720px)]:text-label"
                    id={`hostel-title-${hostel.id}`}
                    title={hostel.name}
                  >
                    {hostel.name}
                  </h3>
                  <p className="hostel-card-price m-0 mb-[5px] overflow-hidden text-label leading-[1.43] font-semibold text-ellipsis whitespace-nowrap [@media(max-width:720px)]:text-label [font-family:var(--font-inter),_sans-serif]">
                    PKR {hostel.pricePerMonth.toLocaleString("en-PK")}
                    <span className="text-meta font-[450] text-muted [@media(max-width:720px)]:text-meta">
                      {" / month"}
                    </span>
                  </p>
                  <div className="hostel-card-meta flex items-center justify-between gap-[7px] text-meta text-muted [@media(max-width:720px)]:text-meta">
                    <span className="hostel-card-area min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap [@media(max-width:720px)]:line-clamp-2 [@media(max-width:720px)]:items-start [@media(max-width:720px)]:whitespace-normal">
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
                            size={14}
                            fill="currentColor"
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
              <HostelFavoriteControl
                accountRole={accountRole}
                favoriteError={favoriteError}
                favoriteStateReady={favoriteStateReady}
                isSaved={savedSlugs.has(hostel.slug)}
                onFavoriteChange={onFavoriteChange}
                hostel={hostel}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
