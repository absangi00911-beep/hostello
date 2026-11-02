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
      "auto-cols-[calc(14.085%_-_13.8px)]",
    );
    expect(markup).toContain(
      "auto-cols-[calc(24.39%_-_11.71px)]",
    );
    expect(markup).toContain("auto-cols-[calc(50%_-_5px)]");
    expect(markup).toContain("[@media(max-width:720px)]:ml-[-20px]");
    expect(markup).toContain("[@media(max-width:720px)]:mr-[-20px]");
    expect(markup).toContain(
      "scroll-padding-inline:calc(4.545%_+_10.36px)",
    );
    expect(markup).toContain("[@media(max-width:720px)]:px-0");
    expect(markup).toContain(
      "pl-[calc(4.545%_+_12.18px)]",
    );
    expect(markup).toContain(
      "pr-[calc(4.545%_+_12.18px)]",
    );
    expect(markup).toContain("group-hover:brightness-[0.9]");
    expect(markup).toContain("group-focus-visible:brightness-[0.9]");
    expect(markup).not.toContain("group-hover:scale-");
    expect(markup).toContain("aria-pressed:text-brand-dark");
    expect(markup).toContain("disabled:opacity-60");
    expect(markup).toContain("focus-visible:outline-2!");
  });

  it("uses a 16px radius on the hostel card and its image", () => {
    const markup = renderRow();

    expect(markup).toContain(
      'class="hostel-card-link group block min-w-0 rounded-[16px]',
    );
    expect(markup).toContain(
      'class="hostel-card-image relative aspect-[1.05] overflow-hidden rounded-[16px]',
    );
  });

  it("renders a white outlined heart directly over the image corner", () => {
    const markup = renderRow();
    const favoriteButtonClass = markup.match(
      /class="([^"]*hostel-favorite-button[^"]*)"/,
    )?.[1];

    expect(markup).toContain("@container/hostel-card");
    expect(favoriteButtonClass).toContain("top-0");
    expect(favoriteButtonClass).toContain("right-0");
    expect(favoriteButtonClass).toContain(
      "size-[clamp(2.75rem,26cqw,3.25rem)]",
    );
    expect(favoriteButtonClass).toContain("bg-transparent");
    expect(favoriteButtonClass).toContain("text-white");
    expect(favoriteButtonClass).not.toContain("bg-white");
    expect(markup).toContain("drop-shadow-[0_1px_2px_rgb(0_0_0/85%)]");
    expect(markup).toContain("size-[clamp(1.25rem,12cqw,1.5rem)]");
    expect(markup).toContain('fill="black"');
    expect(markup).toContain('fill-opacity="0.5"');
    expect(markup).toContain('stroke="white"');
  });

  it("uses the guest heart treatment for authenticated unsaved hostels", () => {
    const markup = renderRow({ accountRole: "STUDENT" });

    expect(markup).toContain('fill="black"');
    expect(markup).toContain('fill-opacity="0.5"');
    expect(markup).toContain('stroke="white"');
    expect(markup).toContain('stroke-width="1.5"');
  });

  it("reflects the server-confirmed saved state", () => {
    const markup = renderRow({ savedSlugs: new Set(["hostel-one"]) });

    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="Remove Hostel One from Wishlists"');
    expect(markup).toContain('fill="currentColor"');
    expect(markup).toContain('fill-opacity="1"');
    expect(markup).toContain('stroke="currentColor"');
  });

  it("hides favorite actions for owner accounts", () => {
    const markup = renderRow({ accountRole: "OWNER" });

    expect(markup).not.toContain("hostel-favorite-button");
    expect(markup).not.toContain("LoginDialogTrigger");
  });
});
