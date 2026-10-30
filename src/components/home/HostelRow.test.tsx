import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HostelRow, type HostelListing } from "./HostelRow";

const hostel: HostelListing = {
  id: "hostel-1",
  slug: "hostel-one",
  name: "Hostel One",
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 15_000,
  coverImage: "https://images.example.com/hostel.jpg",
  images: [],
  rating: 4.5,
  reviewCount: 12,
};

function renderRow({
  accountRole = "STUDENT",
  savedSlugs = new Set<string>(),
}: {
  accountRole?: "STUDENT" | "OWNER" | "ADMIN" | null;
  savedSlugs?: ReadonlySet<string>;
} = {}) {
  return renderToStaticMarkup(
    <HostelRow
      accountRole={accountRole}
      city="Lahore"
      favoriteError={null}
      favoriteStateReady
      hostels={[hostel]}
      isAboveFold
      onFavoriteChange={vi.fn()}
      savedSlugs={savedSlugs}
    />,
  );
}

describe("HostelRow favorite action", () => {
  it("renders the favorite action as a sibling of the hostel detail link", () => {
    const markup = renderRow();
    const detailLinkEnd = markup.indexOf("</a>");
    const favoriteButton = markup.indexOf('class="hostel-favorite-button');

    expect(detailLinkEnd).toBeGreaterThan(-1);
    expect(favoriteButton).toBeGreaterThan(detailLinkEnd);
    expect(markup).toContain('href="/hostels/hostel-1"');
  });

  it("uses Tailwind utilities for the responsive carousel and brightness-only image hover", () => {
    const markup = renderRow();

    expect(markup).toContain(
      "auto-cols-[calc(13.986%_-_13.71px)]",
    );
    expect(markup).toContain(
      "auto-cols-[calc(24.096%_-_11.57px)]",
    );
    expect(markup).toContain(
      "auto-cols-[calc(46.512%_-_11.16px)]",
    );
    expect(markup).toContain("group-hover:brightness-[0.9]");
    expect(markup).toContain("group-focus-visible:brightness-[0.9]");
    expect(markup).not.toContain("group-hover:scale-");
    expect(markup).toContain("aria-pressed:text-brand-dark");
    expect(markup).toContain("disabled:opacity-60");
    expect(markup).toContain("focus-visible:outline-2!");
  });

  it("keeps the favorite control transparent and inset by seven pixels", () => {
    const markup = renderRow();

    expect(markup).toContain("top-[7px]");
    expect(markup).toContain("right-[7px]");
    expect(markup).toContain("bg-transparent");
    expect(markup).toContain("brightness-[0.95]");
  });

  it("reflects the server-confirmed saved state", () => {
    const markup = renderRow({ savedSlugs: new Set(["hostel-one"]) });

    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="Remove Hostel One from Wishlists"');
  });

  it("hides favorite actions for owner accounts", () => {
    const markup = renderRow({ accountRole: "OWNER" });

    expect(markup).not.toContain("hostel-favorite-button");
    expect(markup).not.toContain("LoginDialogTrigger");
  });
});
