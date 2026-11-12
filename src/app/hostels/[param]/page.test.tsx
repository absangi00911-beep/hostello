import { isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPublicHostelDetail: vi.fn(),
  projectPublicHostelDetail: vi.fn(),
  findUnique: vi.fn(),
  getCityLinks: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/city-links", () => ({ getCityLinks: mocks.getCityLinks }));
vi.mock("@/lib/db", () => ({
  db: { favorite: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/hostel-detail", () => ({
  getPublicHostelDetail: mocks.getPublicHostelDetail,
  projectPublicHostelDetail: mocks.projectPublicHostelDetail,
}));
vi.mock("@/lib/hostel-gallery", () => ({
  getHostelGalleryPhotos: () => [],
}));

import HostelDetailPage, { generateMetadata } from "./page";

const hostel = {
  id: "hostel-1",
  name: "Test hostel",
  slug: "test-hostel",
  area: null,
  capacity: 10,
  city: "Quetta",
  description: "A hostel near campus.",
  gender: "MALE",
  rating: 4.5,
  reviewCount: 2,
  rooms: 1,
  verified: true,
  cancellationPolicy: null,
  maxStay: null,
  minStay: null,
  rooms_rel: [],
  coverImage: null,
  images: [],
  amenities: [],
  reviews: [],
  reviewCategoryRatings: [],
  owner: {
    id: "owner-1",
    name: "Host",
    avatar: null,
    bio: null,
    city: null,
    createdAt: new Date("2026-01-01"),
    hostResponseSummary: null,
  },
};

function hasDestinationSearch(node: ReactNode): boolean {
  if (Array.isArray(node)) {
    return node.some(hasDestinationSearch);
  }
  if (!isValidElement<{ "aria-label"?: string; children?: ReactNode }>(node)) {
    return false;
  }
  return (
    node.props["aria-label"] === "Search for hostels by destination" ||
    hasDestinationSearch(node.props.children)
  );
}

function hasMobileHiddenHeader(node: ReactNode): boolean {
  if (Array.isArray(node)) {
    return node.some(hasMobileHiddenHeader);
  }
  if (
    !isValidElement<{
      as?: string;
      className?: string;
      children?: ReactNode;
    }>(node)
  ) {
    return false;
  }
  return (
    (node.props.as === "header" &&
      node.props.className?.includes("[@media(max-width:720px)]:hidden")) ||
    hasMobileHiddenHeader(node.props.children)
  );
}

function findClassName(node: ReactNode, className: string): string | undefined {
  if (Array.isArray(node)) {
    return node
      .map((child) => findClassName(child, className))
      .find((match) => match !== undefined);
  }
  if (
    !isValidElement<{
      className?: string;
      children?: ReactNode;
    }>(node)
  ) {
    return undefined;
  }
  if (node.props.className?.split(/\s+/).includes(className)) {
    return node.props.className;
  }
  return findClassName(node.props.children, className);
}

describe("HostelDetailPage", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue(null);
    mocks.getCityLinks.mockResolvedValue([{ slug: "quetta", name: "Quetta", hostelCount: 4 }]);
    mocks.getPublicHostelDetail.mockResolvedValue(hostel);
    mocks.projectPublicHostelDetail.mockReturnValue({
      ...hostel,
      latitude: null,
      longitude: null,
    });
  });

  it("does not show the destination search pill in the header", async () => {
    const page = await HostelDetailPage({
      params: Promise.resolve({ param: hostel.slug }),
    });

    expect(hasDestinationSearch(page)).toBe(false);
  });

  it("hides the header on mobile screens", async () => {
    const page = await HostelDetailPage({
      params: Promise.resolve({ param: hostel.slug }),
    });

    expect(hasMobileHiddenHeader(page)).toBe(true);
  });

  it("keeps tablet grid rows from overriding mobile host and location placement", async () => {
    const page = await HostelDetailPage({
      params: Promise.resolve({ param: hostel.slug }),
    });
    const hostColumn = findClassName(page, "hostel-detail-host-column");
    const locationColumn = findClassName(page, "hostel-detail-location-column");

    expect(hostColumn).toContain(
      "[@media(min-width:721px)_and_(max-width:900px)]:row-start-2",
    );
    expect(hostColumn).toContain("[@media(max-width:720px)]:row-start-5");
    expect(locationColumn).toContain(
      "[@media(min-width:721px)_and_(max-width:900px)]:row-start-5",
    );
    expect(locationColumn).toContain("[@media(max-width:720px)]:row-start-4");
  });

  it("generates listing-specific metadata", async () => {
    mocks.getPublicHostelDetail.mockResolvedValue({ ...hostel, pricePerMonth: 9000 });

    const metadata = await generateMetadata({ params: Promise.resolve({ param: "test-hostel" }) });

    expect(metadata.title).toBe("Test hostel in Quetta");
    expect(metadata.alternates?.canonical).toBe("/hostels/test-hostel");
  });

  it("does not index a missing hostel", async () => {
    mocks.getPublicHostelDetail.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ param: "gone" }) });

    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("embeds structured data for the hostel", async () => {
    const page = await HostelDetailPage({ params: Promise.resolve({ param: hostel.slug }) });

    expect(JSON.stringify(page)).toContain('"@type":"Hostel"');
  });

  it("links the hostel's city page from a breadcrumb and from the city links, city first", async () => {
    const page = await HostelDetailPage({ params: Promise.resolve({ param: hostel.slug }) });
    const tree = JSON.stringify(page);

    expect(tree).toContain('"city":"Quetta"');
    expect(tree).toContain('"slug":"quetta"');
    expect(mocks.getCityLinks).toHaveBeenCalledWith({ prioritySlug: "quetta" });
  });
});
