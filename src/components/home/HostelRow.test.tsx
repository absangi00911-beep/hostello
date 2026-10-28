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
    const favoriteButton = markup.indexOf('class="hostel-favorite-button"');

    expect(detailLinkEnd).toBeGreaterThan(-1);
    expect(favoriteButton).toBeGreaterThan(detailLinkEnd);
    expect(markup).toContain('href="/hostels/hostel-1"');
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
