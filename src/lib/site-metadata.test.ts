import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SITE_DEFAULT_TITLE,
  buildRootMetadata,
  getMetadataBase,
  getSiteUrl,
} from "@/lib/site-metadata";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("site metadata", () => {
  it("builds absolute URLs from the configured app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.example/");
    expect(getSiteUrl()).toBe("https://hostello.example");
    expect(getMetadataBase()?.origin).toBe("https://hostello.example");
  });

  it("does not throw in production when the app URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("AUTH_URL", "");
    expect(getSiteUrl()).toBeUndefined();
    expect(getMetadataBase()).toBeUndefined();
    expect(() => buildRootMetadata()).not.toThrow();
  });

  it("appends the brand to page titles via the template", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.example");
    const metadata = buildRootMetadata();
    expect(metadata.title).toEqual({
      default: SITE_DEFAULT_TITLE,
      template: "%s | HostelLo",
    });
    expect(metadata.openGraph).toMatchObject({ siteName: "HostelLo", locale: "en_PK" });
  });
});
