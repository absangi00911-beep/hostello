// Path: src/lib/site-metadata.ts
import type { Metadata } from "next";
import { APP_NAME } from "@/config/constants";
import { getAppUrl } from "@/lib/app-url";

export const SITE_DESCRIPTION =
  "Find and book student hostels across Pakistan. Compare prices, facilities and reviews, then book online.";

export const SITE_DEFAULT_TITLE = `${APP_NAME} | Student hostels in Pakistan`;

/** Social share fallback. Per-page images (hostel photos) override this later. */
export const SITE_SHARE_IMAGE = {
  url: "/icon-512.png",
  width: 512,
  height: 512,
  alt: `${APP_NAME} logo`,
};

/**
 * The configured public origin, or undefined when it is not configured.
 * Never throws, so a missing URL cannot break rendering of every page.
 */
export function getSiteUrl(): string | undefined {
  try {
    return getAppUrl();
  } catch {
    return undefined;
  }
}

export function getMetadataBase(): URL | undefined {
  const siteUrl = getSiteUrl();
  return siteUrl ? new URL(siteUrl) : undefined;
}

/** Root metadata. Pages set a short `title`; the template appends the brand. */
export function buildRootMetadata(): Metadata {
  return {
    metadataBase: getMetadataBase(),
    title: { default: SITE_DEFAULT_TITLE, template: `%s | ${APP_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: APP_NAME,
    icons: {
      icon: "/favicon.ico",
      apple: "/icon-192.png",
    },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      locale: "en_PK",
      title: SITE_DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
      images: [SITE_SHARE_IMAGE],
    },
    twitter: {
      card: "summary",
      title: SITE_DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
      images: [SITE_SHARE_IMAGE.url],
    },
  };
}
