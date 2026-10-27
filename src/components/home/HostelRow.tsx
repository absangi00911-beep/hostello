"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useRef } from "react";

export interface HostelListing {
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

export function HostelRow({
  city,
  hostels,
  isAboveFold,
}: {
  city: string;
  hostels: HostelListing[];
  isAboveFold: boolean;
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
            <Link
              aria-label={`View details for ${hostel.name}`}
              className="hostel-card-link"
              href={`/hostels/${hostel.id}`}
              key={hostel.id}
            >
              <article className="hostel-card">
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
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
