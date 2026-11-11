import { describe, expect, it } from "vitest";
import { MAX_SITEMAP_URLS, STATIC_SITEMAP_PATHS, buildSitemapEntries } from "@/lib/sitemap";

const SITE = "https://hostello.example";

describe("buildSitemapEntries", () => {
  it("returns nothing when the site URL is not configured", () => {
    expect(buildSitemapEntries(undefined, [{ slug: "a", updatedAt: new Date() }])).toEqual([]);
  });

  it("lists the public static pages with absolute URLs", () => {
    const urls = buildSitemapEntries(SITE, []).map((entry) => entry.url);
    expect(urls).toHaveLength(STATIC_SITEMAP_PATHS.length);
    expect(urls[0]).toBe(SITE);
    expect(urls).toContain(`${SITE}/search`);
    expect(urls.some((url) => /admin|owner|login|api/.test(url))).toBe(false);
  });

  it("adds each hostel with an encoded slug and its last update", () => {
    const updatedAt = new Date("2026-11-01T00:00:00Z");
    const entries = buildSitemapEntries(SITE, [
      { slug: "green-view-hostel", updatedAt },
      { slug: "caf\u00e9 hostel", updatedAt },
      { slug: "", updatedAt },
    ]);
    const hostels = entries.filter((entry) => entry.url.includes("/hostels/"));

    expect(hostels).toEqual([
      { url: `${SITE}/hostels/green-view-hostel`, lastModified: updatedAt },
      { url: `${SITE}/hostels/caf%C3%A9%20hostel`, lastModified: updatedAt },
    ]);
  });

  it("never exceeds the 50,000 URL protocol limit", () => {
    const many = Array.from({ length: MAX_SITEMAP_URLS + 10 }, (_, i) => ({
      slug: `h-${i}`,
      updatedAt: new Date(),
    }));
    expect(buildSitemapEntries(SITE, many)).toHaveLength(MAX_SITEMAP_URLS);
  });
});
