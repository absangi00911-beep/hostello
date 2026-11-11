import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, groupBy } = vi.hoisted(() => ({ findMany: vi.fn(), groupBy: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { hostel: { findMany, groupBy } } }));

import sitemap from "@/app/sitemap";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.example");
  findMany.mockReset();
  groupBy.mockReset();
  groupBy.mockResolvedValue([]);
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

  it("adds a city page for each city that has active hostels", async () => {
    findMany.mockResolvedValue([]);
    groupBy.mockResolvedValue([
      { city: "Lahore", _count: { _all: 2 } },
      { city: "lahore ", _count: { _all: 1 } },
    ]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE" } }));
    expect(urls.filter((url) => url.includes("/hostels-in/"))).toEqual([
      "https://hostello.example/hostels-in/lahore",
    ]);
  });

  it("keeps hostels when the city query fails, and cities when the hostel query fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    findMany.mockResolvedValue([{ slug: "green-view", updatedAt: new Date("2026-11-01") }]);
    groupBy.mockRejectedValue(new Error("db down"));
    let urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://hostello.example/hostels/green-view");
    expect(urls.some((url) => url.includes("/hostels-in/"))).toBe(false);

    findMany.mockRejectedValue(new Error("db down"));
    groupBy.mockResolvedValue([{ city: "Lahore", _count: { _all: 1 } }]);
    urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://hostello.example/hostels-in/lahore");
    expect(urls.some((url) => url.includes("/hostels/"))).toBe(false);
  });
});
