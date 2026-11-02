import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { ListingStatusActions, getStatusAction } from "./ListingStatusActions";

describe("getStatusAction", () => {
  it("offers only the transitions the API allows owners", () => {
    expect(getStatusAction("ACTIVE")).toMatchObject({ next: "DRAFT" });
    expect(getStatusAction("DRAFT")).toMatchObject({ next: "PENDING_REVIEW" });
    expect(getStatusAction("PENDING_REVIEW")).toBeNull();
    expect(getStatusAction("SUSPENDED")).toBeNull();
  });
});

describe("ListingStatusActions", () => {
  it("renders a button for live and draft listings and nothing otherwise", () => {
    expect(
      renderToStaticMarkup(<ListingStatusActions hostelId="h1" status="ACTIVE" />),
    ).toContain("Unpublish listing");
    expect(
      renderToStaticMarkup(<ListingStatusActions hostelId="h1" status="DRAFT" />),
    ).toContain("Submit for review");
    expect(
      renderToStaticMarkup(
        <ListingStatusActions hostelId="h1" status="PENDING_REVIEW" />,
      ),
    ).toBe("");
  });
});
