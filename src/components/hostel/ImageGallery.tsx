"use client";

// Path: src/components/hostel/ImageGallery.tsx
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Grid2x2, Images } from "lucide-react";

/* ── Types ───────────────────────────────────────────────── */
interface ImageGalleryProps {
  images: string[];
  hostelName: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

/* ── Lightbox ────────────────────────────────────────────── */
interface LightboxProps {
  images: string[];
  hostelName: string;
  startIndex: number;
  onClose: () => void;
}

function Lightbox({ images, hostelName, startIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() =>
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() =>
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  /* Keyboard navigation */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo gallery for ${hostelName}`}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(26,18,10,0.97)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
           style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.01em",
        }}>
          {hostelName}
        </span>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: "rgba(255,255,255,0.40)",
        }}>
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 36, height: 36,
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.70)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main image */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 px-16">
        {images.length > 1 && (
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.80)",
              zIndex: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.20)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
        )}

        <div className="relative w-full h-full">
          <Image
            key={current}
            src={images[current]}
            alt={`${hostelName} — photo ${current + 1} of ${images.length}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.80)",
              zIndex: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.20)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          role="tablist"
          aria-label="Photo thumbnails"
        >
          {images.map((src, i) => (
            <button
              key={src}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setCurrent(i)}
              className="relative shrink-0 rounded overflow-hidden transition-all"
              style={{
                width: 64, height: 48,
                outline: i === current
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
                outlineOffset: 1,
                opacity: i === current ? 1 : 0.45,
              }}
              onMouseEnter={e => { if (i !== current) e.currentTarget.style.opacity = "0.75"; }}
              onMouseLeave={e => { if (i !== current) e.currentTarget.style.opacity = "0.45"; }}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main gallery grid ───────────────────────────────────── */
export function ImageGallery({ images, hostelName }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /* Fallback — no images uploaded yet */
  if (!images || images.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center gap-3"
        style={{
          height: 320,
          background: "var(--color-bg-sidebar)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
        aria-label="No photos available"
      >
        <Images
          size={36}
          strokeWidth={1}
          style={{ color: "var(--color-text-placeholder)" }}
          aria-hidden="true"
        />
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: "var(--color-text-muted)",
        }}>
          No photos uploaded yet
        </p>
      </div>
    );
  }

  const cover    = images[0];
  const side     = images.slice(1, 3);
  const hasMore  = images.length > 3;
  const moreCount = images.length - 3;

  return (
    <>
      {/* ── Grid layout ─────────────────────────────────── */}
      <div
        className="w-full overflow-hidden"
        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        role="region"
        aria-label={`Photos of ${hostelName}`}
      >
        {/* Single image */}
        {images.length === 1 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="relative w-full block"
            style={{ height: 480 }}
            aria-label={`Open photo of ${hostelName}`}
          >
            <Image
              src={cover}
              alt={hostelName}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.015]"
              sizes="100vw"
              priority
            />
          </button>
        )}

        {/* 2 images side by side */}
        {images.length === 2 && (
          <div className="grid grid-cols-2" style={{ height: 400 }}>
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setLightboxIndex(i)}
                className="relative overflow-hidden"
                style={{ borderRight: i === 0 ? "2px solid var(--color-bg-page)" : undefined }}
                aria-label={`Photo ${i + 1} of ${hostelName}`}
              >
                <Image src={src} alt={`${hostelName} ${i + 1}`} fill
                  className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                  sizes="50vw" priority={i === 0} />
              </button>
            ))}
          </div>
        )}

        {/* 3+ images — asymmetric grid */}
        {images.length >= 3 && (
          <div
            className="grid"
            style={{
              height: 480,
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 3,
            }}
          >
            {/* Cover — spans full left column */}
            <button
              onClick={() => setLightboxIndex(0)}
              className="relative overflow-hidden"
              style={{ gridRow: "1 / 3" }}
              aria-label={`Cover photo of ${hostelName}`}
            >
              <Image
                src={cover}
                alt={hostelName}
                fill
                className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                sizes="50vw"
                priority
              />
            </button>

            {/* Right column — 2 tiles */}
            {side.map((src, i) => {
              const globalIndex = i + 1;
              const isLastVisible = i === 1 && hasMore;

              return (
                <button
                  key={src}
                  onClick={() => setLightboxIndex(globalIndex)}
                  className="relative overflow-hidden group"
                  aria-label={
                    isLastVisible
                      ? `View all ${images.length} photos`
                      : `Photo ${globalIndex + 1} of ${hostelName}`
                  }
                >
                  <Image
                    src={src}
                    alt={`${hostelName} ${globalIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="25vw"
                  />
                  {isLastVisible && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                      style={{ background: "rgba(26,18,10,0.62)" }}
                    >
                      <Grid2x2 size={22} strokeWidth={1.5} style={{ color: "#fff" }} aria-hidden="true" />
                      <span style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-body-sm)",
                        fontWeight: 600,
                        color: "#fff",
                      }}>
                        +{moreCount} more
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* See all button */}
        {images.length >= 3 && (
          <div className="flex justify-end px-4 py-2"
               style={{ background: "var(--color-bg-raised)" }}>
            <button
              onClick={() => setLightboxIndex(0)}
              className="flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border-default)",
                background: "var(--color-bg-card)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-caption)",
                fontWeight: 600,
                color: "var(--color-text-body)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-overlay)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-bg-card)")}
            >
              <Grid2x2 size={13} strokeWidth={1.5} aria-hidden="true" />
              See all {images.length} photos
            </button>
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          hostelName={hostelName}
          startIndex={clamp(lightboxIndex, 0, images.length - 1)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}