import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), load: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/owner-listing", () => ({ getOwnerListingForEdit: mocks.load }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import EditListingRoute from "./page";

const listing = {
  id: "h1",
  status: "ACTIVE",
  name: "Green Hostel",
  description:
    "A quiet, student-friendly hostel close to the university campus with study areas.",
  gender: "MIXED",
  city: "Faisalabad",
  area: null,
  address: "Street 4, Satiana Road, Faisalabad",
  latitude: null,
  longitude: null,
  amenities: ["wifi"],
  images: [],
  minStay: 1,
  maxStay: null,
  cancellationPolicy: "STANDARD",
  rules: [],
  rooms: [],
};

const params = Promise.resolve({ id: "h1" });

describe("EditListingRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.load.mockReset();
  });

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(EditListingRoute({ params })).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fowner%2Flistings%2Fh1%2Fedit",
    );
  });

  it.each(["STUDENT", "ADMIN"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

    await expect(EditListingRoute({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("returns not found when the listing isn't this owner's", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER" } });
    mocks.load.mockResolvedValue(null);

    await expect(EditListingRoute({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.load).toHaveBeenCalledWith("o1", "h1");
  });

  it("renders the status action and the prefilled form", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER", name: "Sana" } });
    mocks.load.mockResolvedValue(listing);

    const markup = renderToStaticMarkup(await EditListingRoute({ params }));

    expect(markup).toContain("Edit listing");
    expect(markup).toContain("Unpublish listing");
    expect(markup).toContain('value="Green Hostel"');
  });

  it("shows a notice instead of the form for suspended listings", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER" } });
    mocks.load.mockResolvedValue({ ...listing, status: "SUSPENDED" });

    const markup = renderToStaticMarkup(await EditListingRoute({ params }));

    expect(markup).toContain("can&#x27;t be edited");
    expect(markup).not.toContain("<form");
  });
});
