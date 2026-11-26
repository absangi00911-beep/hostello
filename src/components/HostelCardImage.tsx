"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface HostelCardImageProps {
  alt: string;
  className: string;
  fetchPriority?: ImageProps["fetchPriority"];
  loading?: ImageProps["loading"];
  sizes: string;
  src: string | null | undefined;
}

export function HostelCardImage({
  alt,
  className,
  fetchPriority,
  loading,
  sizes,
  src,
}: HostelCardImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        aria-label={`No photo available for ${alt}`}
        className="hostel-image-fallback grid h-full w-full place-items-center bg-surface-muted px-3 text-center text-meta font-medium text-muted"
        role="img"
      >
        Photo unavailable
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      fetchPriority={fetchPriority}
      fill
      loading={loading}
      onError={() => setFailedSrc(src)}
      sizes={sizes}
      src={src}
    />
  );
}
