import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ListingForm, ListingSubmitted } from "./ListingForm";
import { ListingRoomsEditor } from "./ListingRoomsEditor";
import { ListingPhotosField, validateImageFile } from "./ListingPhotosField";
import { emptyRoom, roomFieldKey } from "./listingForm";

describe("ListingForm", () => {
  const markup = renderToStaticMarkup(<ListingForm />);

  it("renders every section with labelled controls and no initial errors", () => {
    for (const text of [
      "Hostel name",
      "Description",
      "Who is it for?",
      "Full address",
      "Rooms",
      "Amenities",
      "Photos",
      "Minimum stay (months)",
      "House rules (optional)",
      "Cancellation policy",
      "Submit for review",
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).not.toContain('role="alert"');
    expect(markup).not.toContain('aria-invalid="true"');
  });

  it("offers the shared cities, amenities and all three cancellation policies", () => {
    expect(markup).toContain("<option value=\"Faisalabad\">Faisalabad</option>");
    expect(markup).toContain('value="wifi"');
    for (const policy of ["FLEXIBLE", "STANDARD", "STRICT"]) {
      expect(markup).toContain(`value="${policy}"`);
    }
  });

  it("states that new listings are reviewed before going live", () => {
    expect(markup).toContain("reviewed before they become visible");
  });
});

describe("ListingSubmitted", () => {
  it("explains the pending-review state and links back to the dashboard", () => {
    const markup = renderToStaticMarkup(<ListingSubmitted onAddAnother={vi.fn()} />);

    expect(markup).toContain("Listing submitted for review");
    expect(markup).toContain("isn&#x27;t visible to students yet");
    expect(markup).toContain('href="/owner"');
  });
});

describe("ListingRoomsEditor", () => {
  it("shows field errors and prevents removing the only room type", () => {
    const markup = renderToStaticMarkup(
      <ListingRoomsEditor
        errors={{ [roomFieldKey(0, "pricePerMonth")]: "Price problem" }}
        onChange={vi.fn()}
        rooms={[emptyRoom()]}
      />,
    );

    expect(markup).toContain("Price problem");
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toMatch(/aria-label="Remove room type 1"[^>]*\sdisabled=""/);
  });

  it("allows removing a room type once there are several", () => {
    const markup = renderToStaticMarkup(
      <ListingRoomsEditor errors={{}} onChange={vi.fn()} rooms={[emptyRoom(), emptyRoom()]} />,
    );

    expect(markup).not.toMatch(/aria-label="Remove room type 1"[^>]*\sdisabled=""/);
    expect(markup).toContain("Room type 2");
  });
});

describe("ListingPhotosField", () => {
  it("marks the first photo as the cover and offers Make cover on the others", () => {
    const markup = renderToStaticMarkup(
      <ListingPhotosField
        images={["https://images.unsplash.com/a.jpg", "https://images.unsplash.com/b.jpg"]}
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("Cover");
    expect(markup.match(/Make cover/g)).toHaveLength(1);
    expect(markup).toContain("2/15 photos");
  });

  it("disables adding once the limit is reached", () => {
    const images = Array.from({ length: 15 }, (_, i) => `https://images.unsplash.com/${i}.jpg`);
    const markup = renderToStaticMarkup(<ListingPhotosField images={images} onChange={vi.fn()} />);

    expect(markup).toMatch(/<button[^>]*\sdisabled=""[^>]*>(?:(?!<\/button>).)*Add photos/s);
  });

  it("keeps adding enabled below the limit", () => {
    const markup = renderToStaticMarkup(
      <ListingPhotosField images={["https://images.unsplash.com/a.jpg"]} onChange={vi.fn()} />,
    );

    expect(markup).not.toMatch(/\sdisabled=""/);
  });
});

describe("validateImageFile", () => {
  it("mirrors the upload API's type and size limits", () => {
    expect(validateImageFile({ type: "image/png", size: 1024 })).toBeNull();
    expect(validateImageFile({ type: "image/gif", size: 1024 })).toMatch(/JPEG/);
    expect(validateImageFile({ type: "image/jpeg", size: 0 })).toMatch(/4MB/);
    expect(validateImageFile({ type: "image/jpeg", size: 4 * 1024 * 1024 + 1 })).toMatch(/4MB/);
  });
});

describe("ListingForm in edit mode", () => {
  const existing = {
    id: "h1",
    listing: {
      name: "Green Hostel",
      description:
        "A quiet, student-friendly hostel close to the university campus with study areas.",
      gender: "MIXED",
      city: "Faisalabad",
      area: "Satiana Road",
      address: "Street 4, Satiana Road, Faisalabad",
      latitude: null,
      longitude: null,
      amenities: ["wifi"],
      images: [],
      minStay: 1,
      maxStay: null,
      cancellationPolicy: "FLEXIBLE",
      rules: [],
      rooms: [
        {
          id: "r1",
          name: "Double room",
          description: null,
          pricePerMonth: 15000,
          capacity: 2,
          facilities: [],
          images: [],
        },
      ],
    },
  };
  const markup = renderToStaticMarkup(<ListingForm existing={existing} />);

  it("prefills the stored values and says saving sends the listing back to review", () => {
    expect(markup).toContain('value="Green Hostel"');
    expect(markup).toContain('value="Double room"');
    expect(markup).toContain("Save and submit for review");
    expect(markup).toContain("sends the listing back to review");
    expect(markup).not.toContain("New listings are reviewed");
  });
});

describe("ListingSubmitted after an edit", () => {
  it("explains the listing is back in review and offers no add-another action", () => {
    const markup = renderToStaticMarkup(<ListingSubmitted updated />);

    expect(markup).toContain("Changes saved and submitted for review");
    expect(markup).toContain("pending review again");
    expect(markup).not.toContain("Add another listing");
  });
});
