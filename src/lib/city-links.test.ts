import { beforeEach, describe, expect, it, vi } from "vitest";

const getCitySummaries = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("@/lib/city-pages", () => ({ getCitySummaries }));

import { getCityLinks, selectCityLinks } from "@/lib/city-links";

const summaries = [
  { slug: "lahore", name: "Lahore", spellings: ["Lahore"], hostelCount: 20 },
  { slug: "karachi", name: "Karachi", spellings: ["Karachi"], hostelCount: 12 },
  { slug: "quetta", name: "Quetta", spellings: ["Quetta"], hostelCount: 3 },
];

beforeEach(() => {
  getCitySummaries.mockReset();
});

describe("selectCityLinks", () => {
  it("keeps the biggest-first order and drops internal fields", () => {
    expect(selectCityLinks(summaries)).toEqual([
      { slug: "lahore", name: "Lahore", hostelCount: 20 },
      { slug: "karachi", name: "Karachi", hostelCount: 12 },
      { slug: "quetta", name: "Quetta", hostelCount: 3 },
    ]);
  });

  it("puts the current page's city first and applies the limit", () => {
    expect(selectCityLinks(summaries, 2, "quetta").map((city) => city.slug)).toEqual(["quetta", "lahore"]);
  });

  it("ignores an unknown priority slug", () => {
    expect(selectCityLinks(summaries, 5, "nowhere")).toHaveLength(3);
  });
});

describe("getCityLinks", () => {
  it("returns links from the cached summaries", async () => {
    getCitySummaries.mockResolvedValue(summaries);
    expect((await getCityLinks({ limit: 1 })).map((city) => city.slug)).toEqual(["lahore"]);
  });

  it("returns an empty list instead of throwing when the query fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    getCitySummaries.mockRejectedValue(new Error("db down"));
    expect(await getCityLinks()).toEqual([]);
  });
});
