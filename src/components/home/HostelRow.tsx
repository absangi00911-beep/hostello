"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Star } from "lucide-react";
import { useRef, useState } from "react";
import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { hostelCardImageClassName } from "@/components/hostel-card-styles";

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
  "hostel-favorite-button absolute top-[7px] right-[7px] z-[2] grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent brightness-[0.95] no-underline transition-[transform,color,background-color] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04] active:scale-[0.92] aria-pressed:text-brand-dark disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[3px]! motion-reduce:hover:transform-none! motion-reduce:active:transform-none!";

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
        <Heart aria-hidden="true" fill="currentColor" size={21} />
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
          fill="currentColor"
          size={21}
        />
      </button>
      {message && (
        <p
          className={`hostel-favorite-feedback mt-2 mb-0 text-[0.78rem] leading-[1.4] ${
            isError ? "text-[#a12622]" : "text-muted"
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

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.85,
      behavior,
    });
  }

  return (
    <section className="mb-7" aria-labelledby={`stays-${city}`}>
      <div className="mb-3 flex items-center justify-between gap-[18px]">
        <h2 className="m-0 text-[1.3125rem] font-bold leading-[1.43] tracking-0" id={`stays-${city}`}>
          Stays in {city}
        </h2>
        <div className="flex flex-[0_0_auto] gap-2">
          <button
            aria-label={`Scroll ${city} listings left`}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink transition-colors duration-[160ms] hover:border-ink hover:bg-surface-muted"
            onClick={() => scrollCarousel(-1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Scroll ${city} listings right`}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink transition-colors duration-[160ms] hover:border-ink hover:bg-surface-muted"
            onClick={() => scrollCarousel(1)}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div
        className="hostel-carousel grid grid-flow-col auto-cols-[calc(13.986%_-_13.71px)] gap-[14px] overflow-x-auto overscroll-x-contain px-px pb-[10px] [scroll-padding-inline:1px] snap-x snap-mandatory [scrollbar-width:none] [@media(min-width:721px)_and_(max-width:1100px)]:auto-cols-[calc(24.096%_-_11.57px)] [@media(min-width:721px)_and_(max-width:1100px)]:gap-3 [@media(max-width:720px)]:auto-cols-[calc(46.512%_-_11.16px)] [@media(max-width:720px)]:gap-3"
        ref={carouselRef}
        role="region"
        aria-label={`Stays in ${city}`}
        tabIndex={0}
      >
        {hostels.map((hostel, index) => {
          const image = hostel.coverImage || hostel.images[0];

          return (
            <article
              className="hostel-card relative min-w-0 snap-start overflow-visible border-0 rounded-none bg-transparent"
              key={hostel.id}
            >
              <Link
                aria-label={`View details for ${hostel.name}`}
                className="hostel-card-link group block min-w-0 rounded-[14px] text-inherit transition-transform duration-[160ms] active:scale-[0.99] motion-reduce:active:transform-none!"
                href={`/hostels/${hostel.id}`}
              >
                <div className="hostel-card-image relative aspect-[1.05] overflow-hidden rounded-[14px] bg-brand-soft">
                  {image ? (
                    <Image
                      alt={hostel.name}
                      className={hostelCardImageClassName}
                      fill
                      loading={isAboveFold && index < 10 ? "eager" : "lazy"}
                      sizes="(max-width: 720px) 40vw, (max-width: 1100px) 23vw, 12vw"
                      src={image}
                    />
                  ) : (
                    <div
                      className="hostel-image-fallback h-full w-full bg-[linear-gradient(135deg,transparent_40%,rgb(47_101_73/16%)),var(--brand-soft)]"
                      role="img"
                      aria-label={`No photo available for ${hostel.name}`}
                    />
                  )}
                </div>
                <div className="hostel-card-details px-[2px] pt-2 pb-1 [@media(max-width:720px)]:px-0">
                  <h3
                    className="m-0 mb-[3px] overflow-hidden text-[0.875rem] font-semibold leading-[1.25] tracking-normal text-ellipsis whitespace-nowrap [@media(max-width:720px)]:text-[0.82rem]"
                    title={hostel.name}
                  >
                    {hostel.name}
                  </h3>
                  <p className="hostel-card-price m-0 mb-[5px] overflow-hidden text-[0.875rem] leading-[1.43] font-semibold text-ellipsis whitespace-nowrap [@media(max-width:720px)]:text-[0.73rem] [font-family:var(--font-inter),_sans-serif]">
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
