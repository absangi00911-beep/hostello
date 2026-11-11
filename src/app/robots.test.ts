import { afterEach, describe, expect, it, vi } from "vitest";
import robots, { DISALLOWED_PATHS } from "@/app/robots";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots.txt", () => {
  it("allows public pages, blocks private areas and links the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.example");
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rule.allow).toBe("/");
    for (const path of ["/api/", "/admin", "/owner", "/bookings", "/profile"]) {
      expect(rule.disallow).toContain(path);
    }
    expect(DISALLOWED_PATHS).not.toContain("/hostels");
    expect(DISALLOWED_PATHS).not.toContain("/search");
    expect(result.sitemap).toBe("https://hostello.example/sitemap.xml");
  });

  it("omits the sitemap when the app URL is not configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("AUTH_URL", "");
    expect(robots().sitemap).toBeUndefined();
  });
});
