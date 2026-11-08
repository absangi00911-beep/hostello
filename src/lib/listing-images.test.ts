import { afterEach, describe, expect, it, vi } from "vitest";
import { findUntrustedListingImage, isTrustedListingImageUrl } from "@/lib/listing-images";

describe("listing image trust", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only objects under the configured public bucket", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc.r2.dev/");
    expect(isTrustedListingImageUrl("https://pub-abc.r2.dev/hostels/1-a-photo.jpg")).toBe(true);
    expect(isTrustedListingImageUrl("https://pub-evil.r2.dev/hostels/1.jpg")).toBe(false);
    expect(isTrustedListingImageUrl("https://pub-abc.r2.dev.evil.com/x.jpg")).toBe(false);
    expect(isTrustedListingImageUrl("https://pub-abc.r2.dev@evil.com/x.jpg")).toBe(false);
    expect(isTrustedListingImageUrl("http://pub-abc.r2.dev/x.jpg")).toBe(false);
    expect(isTrustedListingImageUrl("https://pub-abc.r2.dev/")).toBe(false);
    expect(isTrustedListingImageUrl("javascript:alert(1)")).toBe(false);
    expect(isTrustedListingImageUrl("not a url")).toBe(false);
  });

  it("honours a path prefix on the public URL", () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.example.com/media");
    expect(isTrustedListingImageUrl("https://cdn.example.com/media/hostels/a.jpg")).toBe(true);
    expect(isTrustedListingImageUrl("https://cdn.example.com/mediax/a.jpg")).toBe(false);
    expect(isTrustedListingImageUrl("https://cdn.example.com/other/a.jpg")).toBe(false);
  });

  it("fails closed in production when no bucket is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_PUBLIC_URL", "");
    expect(isTrustedListingImageUrl("https://images.unsplash.com/photo-1?w=800")).toBe(false);
  });

  it("allows only the Unsplash placeholder outside production without a bucket", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("R2_PUBLIC_URL", "");
    expect(isTrustedListingImageUrl("https://images.unsplash.com/photo-1?w=800")).toBe(true);
    expect(isTrustedListingImageUrl("https://evil.com/x.jpg")).toBe(false);
  });

  it("checks the cover image as well as the gallery", () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc.r2.dev");
    const ok = "https://pub-abc.r2.dev/hostels/a.jpg";
    expect(findUntrustedListingImage([ok], ok)).toBeNull();
    expect(findUntrustedListingImage([ok], "https://evil.com/c.jpg")).toBe("https://evil.com/c.jpg");
    expect(findUntrustedListingImage(undefined, null)).toBeNull();
  });
});
