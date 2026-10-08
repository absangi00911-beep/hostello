"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { PhotoFallback } from "@/components/landing/PhotoFallback";

type PhotoImageProps = Omit<ImageProps, "onError"> & { dark?: boolean };

/** Keep the illustrated room visible and remove broken remote images on failure. */
export function PhotoImage({ dark = false, alt, ...imageProps }: PhotoImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      <PhotoFallback dark={dark} />
      {failed ? (
        alt ? <span className="sr-only" role="img" aria-label={alt} /> : null
      ) : (
        <Image {...imageProps} alt={alt} onError={() => setFailed(true)} />
      )}
    </>
  );
}
