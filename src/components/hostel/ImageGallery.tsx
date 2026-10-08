"use client";

// Path: src/components/hostel/ImageGallery.tsx
import { useState, useCallback, useRef, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type RefObject } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Grid2x2, Images } from "lucide-react";
import { useModalFocus } from "@/components/ui/use-modal-focus";

/* -- Types ------------------------------------------------- */
interface ImageGalleryProps {
  images: string[];
  hostelName: string;
}

/* -- Helpers ----------------------------------------------- */
function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

/* -- Lightbox ---------------------------------------------- */
interface LightboxProps {
  images: string[];
  hostelName: string;
  startIndex: number;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

function Lightbox({ images, hostelName, startIndex, onClose, returnFocusRef }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const prev = useCallback(() =>
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() =>
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  useModalFocus({
    dialogRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef,
    onEscape: onClose,
  });

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo gallery for ${hostelName}`}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0d0e0f]/97"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/[0.08]">
        <span style={{
          fontSize: "var(--text-body-sm)",
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.01em",
        }}>
          {hostelName}
        </span>
        <span style={{
          fontSize: "var(--text-body-sm)",
          color: "rgba(255,255,255,0.40)",
        }}>
          {current + 1} / {images.length}
        </span>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close gallery"
          className="flex items-center justify-center rounded-full transition-colors bg-white/[0.08] text-white/70 hover:bg-white/[0.16]"
          style={{ width: 36, height: 36 }}
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
            className="absolute left-3 flex items-center justify-center rounded-full transition-all bg-white/10 text-white/80 hover:bg-white/20 z-10"
            style={{ width: 44, height: 44 }}
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
            className="absolute right-3 flex items-center justify-center rounded-full transition-all bg-white/10 text-white/80 hover:bg-white/20 z-10"
            style={{ width: 44, height: 44 }}
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3 border-t border-white/[0.08]"
          role="group"
          aria-label="Photo thumbnails"
        >
          {images.map((src, i) => (
            <button
              key={src}
              aria-pressed={i === current}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 rounded overflow-hidden transition-all ${i === current ? "outline outline-2 outline-[var(--color-primary)]" : ""}`}
              style={{
                width: 64, height: 48,
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

/* -- Main gallery grid ------------------------------------- */
export function ImageGallery({ images, hostelName }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxReturnFocusRef = useRef<HTMLElement | null>(null);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  function openLightbox(index: number, event: MouseEvent<HTMLButtonElement>) {
    lightboxReturnFocusRef.current = event.currentTarget;
    setLightboxIndex(index);
  }

  /* Fallback — no images uploaded yet */
  if (!images || images.length === 0) {
    return (
      <div
        className="flex h-[min(320px,60vw)] min-h-[220px] w-full flex-col items-center justify-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]"
        aria-label="No photos available"
      >
        <Images
          size={36}
          strokeWidth={1} className="text-[color:var(--color-text-placeholder)]"
          aria-hidden="true"
        />
        <p style={{
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

  return (
    <>
      {/* -- Grid layout ----------------------------------- */}
      <div
        className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border-b border-[var(--color-border-subtle)]"
        role="region"
        aria-label={`Photos of ${hostelName}`}
      >
        {/* Single image */}
        {images.length === 1 && (
          <button
            onClick={(event) => openLightbox(0, event)}
            className="relative block aspect-[4/3] w-full sm:aspect-[16/9] lg:h-[480px] lg:aspect-auto"
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
          <div className="grid aspect-[4/3] grid-cols-2 sm:aspect-[2/1] lg:h-[400px] lg:aspect-auto">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={(event) => openLightbox(i, event)}
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
            className="grid aspect-[4/3] sm:aspect-[16/7] lg:h-[480px] lg:aspect-auto"
            style={{
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 3,
            }}
          >
            {/* Cover — spans full left column */}
            <button
              onClick={(event) => openLightbox(0, event)}
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

              return (
                <button
                  key={src}
                  onClick={(event) => openLightbox(globalIndex, event)}
                  className="relative overflow-hidden group"
                  aria-label={`Photo ${globalIndex + 1} of ${hostelName}`}
                >
                  <Image
                    src={src}
                    alt={`${hostelName} ${globalIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="25vw"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* "See all" overlays the mosaic itself, bottom-right — Airbnb's
            actual placement, not a separate bar underneath */}
        {images.length >= 3 && (
          <button
            onClick={(event) => openLightbox(0, event)}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-4 py-2 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-heading)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-bg-overlay)]"
          >
            <Grid2x2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Show all {images.length} photos
          </button>
        )}
      </div>

      {/* -- Lightbox --------------------------------------- */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          hostelName={hostelName}
          startIndex={clamp(lightboxIndex, 0, images.length - 1)}
          onClose={closeLightbox}
          returnFocusRef={lightboxReturnFocusRef}
        />
      )}
    </>
  );
}
