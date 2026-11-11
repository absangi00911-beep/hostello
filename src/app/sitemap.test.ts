import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { hostel: { findMany } } }));

import sitemap from "@/app/sitemap";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.example");
  findMany.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sitemap.xml route", () => {
  it("queries only ACTIVE hostels and maps them to URLs", async () => {
    findMany.mockResolvedValue([{ slug: "green-view", updatedAt: new Date("2026-11-01") }]);

    const entries = await sitemap();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    );
    expect(entries.map((entry) => entry.url)).toContain("https://hostello.example/hostels/green-view");
  });

  it("falls back to the static pages when the database is down", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    findMany.mockRejectedValue(new Error("db down"));

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.url.includes("/hostels/"))).toBe(false);
  });

  it("returns an empty sitemap when the app URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("AUTH_URL", "");
    expect(await sitemap()).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
