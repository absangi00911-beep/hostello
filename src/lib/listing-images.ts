// Path: src/lib/listing-images.ts

/**
 * Listing photos must come from this project's public image bucket, which is
 * what /api/upload returns. Without this check an owner could submit any URL,
 * including one on a third-party r2.dev bucket whose content can change after
 * an admin approves the listing.
 *
 * Outside production, when no bucket is configured, /api/upload returns an
 * Unsplash placeholder, so that single host is accepted to keep local flows
 * working. Production fails closed.
 */
const DEV_PLACEHOLDER_HOST = "images.unsplash.com";

function parseHttps(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function isTrustedListingImageUrl(value: string): boolean {
  const url = parseHttps(value);
  if (!url) return false;

  const configured = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    const base = parseHttps(configured);
    if (!base) return false;
    const prefix = base.pathname.replace(/\/+$/, "");
    return (
      url.origin === base.origin &&
      (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) &&
      url.pathname !== `${prefix}/` &&
      url.pathname.length > prefix.length + 1
    );
  }

  return process.env.NODE_ENV !== "production" && url.hostname === DEV_PLACEHOLDER_HOST;
}

/** Returns the first image URL that is not from the trusted bucket, or null. */
export function findUntrustedListingImage(
  images: readonly string[] | undefined,
  coverImage?: string | null,
): string | null {
  const all = [...(images ?? []), ...(coverImage ? [coverImage] : [])];
  return all.find((value) => !isTrustedListingImageUrl(value)) ?? null;
}

export const UNTRUSTED_LISTING_IMAGE_ERROR =
  "Listing photos must be uploaded through HostelLo.";
