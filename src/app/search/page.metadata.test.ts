import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("./SearchPageClient", () => ({ default: () => null }));

import { generateMetadata } from "./page";

describe("search page metadata", () => {
  it("is indexable only without parameters", async () => {
    expect((await generateMetadata({ searchParams: Promise.resolve({}) })).robots).toBeUndefined();
    expect(
      (await generateMetadata({ searchParams: Promise.resolve({ city: "Lahore" }) })).robots,
    ).toEqual({ index: false, follow: true });
  });
});
