import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { hostel: { findFirst: vi.fn() } },
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/components/layout/PublicLayout", () => ({
  PublicLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/hostel/ImageGallery", () => ({
  ImageGallery: ({ images }: { images: string[] }) => <div>{images.join("|")}</div>,
}));
vi.mock("@/components/hostel/ReviewList", () => ({ ReviewList: () => null }));
vi.mock("@/components/hostel/HostelMap", () => ({
  HostelMap: () => null,
  NoMapAvailable: () => null,
}));
vi.mock("@/components/ui/shared", () => ({
  StatusBadge: () => null,
  formatPKR: (amount: number) => `PKR ${amount}`,
}));
vi.mock("@/components/hostel/ShareButton", () => ({ ShareButton: () => null }));
vi.mock("@/components/hostel/TrustSummary", () => ({ TrustSummary: () => null }));
vi.mock("@/components/ui/tabs", () => {
  const Wrapper = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return {
    Tabs: Wrapper,
    TabsContent: Wrapper,
    TabsList: Wrapper,
    TabsTrigger: Wrapper,
  };
});
vi.mock("@/components/ui/avatar", () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Avatar: Wrapper,
    AvatarImage: () => null,
    AvatarFallback: Wrapper,
  };
});

import { db } from "@/lib/db";
import HostelDetailPage from "./page";

const hostel = {
  id: "hostel-1",
  slug: "green-view",
  name: "Green View",
  description: "A quiet student hostel in Gulberg.",
  city: "Lahore",
  area: "Gulberg",
  address: "123 Main Road",
  gender: "FEMALE",
  verified: true,
  rating: 4.5,
  reviewCount: 0,
  pricePerMonth: 10000,
  coverImage: null,
  images: ["https://images.hostello.test/hostel-exterior.jpg"],
  amenities: ["Wi-Fi"],
  rules: [],
  latitude: null,
  longitude: null,
  owner: { id: "owner-1", name: "Owner", avatar: null, _count: { hostels: 1 } },
  reviews: [],
  rooms_rel: [
    {
      id: "room-gv-1",
      name: "Standard Double",
      pricePerMonth: 8500,
      capacity: 2,
      available: 1,
      images: ["https://images.hostello.test/room-photo.jpg"],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.hostel.findFirst).mockResolvedValue(hostel as never);
});

describe("hostel overview", () => {
  it("shows hostel photos and room links without hostel-level booking or payment controls", async () => {
    const page = await HostelDetailPage({
      params: Promise.resolve({ slug: "green-view" }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("hostel-exterior.jpg");
    expect(markup).not.toContain("room-photo.jpg");
    expect(markup).toContain("/hostels/green-view/rooms/room-gv-1");
    expect(markup).not.toContain("Request booking");
    expect(markup).not.toContain("payment");
  });
});
