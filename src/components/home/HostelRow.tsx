"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Star } from "lucide-react";
import { useRef, useState } from "react";
import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";

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
        className="hostel-favorite-button"
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
        className="hostel-favorite-button"
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
          className="hostel-favorite-feedback"
          role={isError ? "alert" : "status"}
        >
          {message}
          {requiresSignIn && (
            <>
              {" "}
              <LoginDialogTrigger>Sign in</LoginDialogTrigger>
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
    <section className="browse-row" aria-labelledby={`stays-${city}`}>
      <div className="browse-row-heading">
        <h2 id={`stays-${city}`}>Stays in {city}</h2>
        <div className="browse-row-controls">
          <button
            aria-label={`Scroll ${city} listings left`}
            className="browse-scroll-button"
            onClick={() => scrollCarousel(-1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Scroll ${city} listings right`}
            className="browse-scroll-button"
            onClick={() => scrollCarousel(1)}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div
        className="hostel-carousel"
        ref={carouselRef}
        role="region"
        aria-label={`Stays in ${city}`}
        tabIndex={0}
      >
        {hostels.map((hostel, index) => {
          const image = hostel.coverImage || hostel.images[0];

          return (
            <article className="hostel-card" key={hostel.id}>
              <Link
                aria-label={`View details for ${hostel.name}`}
                className="hostel-card-link"
                href={`/hostels/${hostel.id}`}
              >
                <div className="hostel-card-image">
                  {image ? (
                    <Image
                      alt={hostel.name}
                      className="hostel-card-photo"
                      fill
                      loading={isAboveFold && index < 10 ? "eager" : "lazy"}
                      sizes="(max-width: 720px) 40vw, (max-width: 1100px) 23vw, 12vw"
                      src={image}
                    />
                  ) : (
                    <div
                      className="hostel-image-fallback"
                      role="img"
                      aria-label={`No photo available for ${hostel.name}`}
                    />
                  )}
                </div>
                <div className="hostel-card-details">
                  <h3 title={hostel.name}>{hostel.name}</h3>
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
