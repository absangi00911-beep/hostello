import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HeroSearch } from "./HeroSearch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("HeroSearch", () => {
  it("shows one keyword search without city, filter, or popular-city controls", () => {
    const markup = renderToStaticMarkup(<HeroSearch />);

    expect(markup).toContain('aria-label="Find a hostel"');
    expect(markup).toContain('aria-label="Search hostels"');
    expect(markup).toContain("Search by hostel, area, or university");
    expect(markup).not.toContain("Choose city");
    expect(markup).not.toContain("Refine by");
    expect(markup).not.toContain("Popular cities");
    expect(markup).not.toContain("Under 20k");
  });
});
