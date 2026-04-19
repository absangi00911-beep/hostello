"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";

interface HostelGalleryProps {
  images: string[];
  name: string;
}

export function HostelGallery({ images, name }: HostelGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="h-72 bg-[var(--color-sand-100)] flex items-center justify-center text-[var(--color-sand-300)]">
        <Images className="w-12 h-12" />
      </div>
    );
  }

  const [main, ...thumbs] = images;

  function prev() {
    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
  }
  function next() {
    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 overflow-hidden">
        {/* Main image */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="col-span-2 row-span-2 relative overflow-hidden rounded-l-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-700)]"
        >
          <Image
            src={main}
            alt={`${name} — photo 1`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </button>

        {/* Thumbnails */}
        {thumbs.slice(0, 4).map((img, i) => (
          <button
            key={img}
            onClick={() => setLightboxIndex(i + 1)}
            className={cn(
              "relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-700)]",
              i === 1 && "rounded-tr-2xl",
              i === 3 && "rounded-br-2xl"
            )}
          >
            <Image
              src={img}
              alt={`${name} — photo ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
            {/* "Show all" overlay on last thumb */}
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                +{images.length - 5} more
              </div>
            )}
          </button>
        ))}

        {/* Fill empty slots */}
        {thumbs.length < 4 &&
          Array.from({ length: 4 - thumbs.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-[var(--color-sand-100)]" />
          ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {lightboxIndex + 1} / {images.length}
          </span>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[80vh] aspect-[4/3] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${name} — photo ${lightboxIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
