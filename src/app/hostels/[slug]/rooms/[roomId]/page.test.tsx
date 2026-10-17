import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { room: { findFirst: vi.fn() } },
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
vi.mock("@/components/hostel/BookingPanel", () => ({
  BookingPanel: ({ rooms }: { rooms: Array<{ name: string }> }) => (
    <aside aria-label="room booking">{rooms.map((room) => room.name).join(",")}</aside>
  ),
}));

import { db } from "@/lib/db";
import RoomDetailsPage from "./page";

const room = {
  id: "room-gv-1",
  name: "Standard Double",
  description: "A bright room for two students.",
  pricePerMonth: 8500,
  capacity: 2,
  available: 1,
  facilities: ["Two single beds", "Shared bathroom"],
  images: ["https://images.hostello.test/standard-room.jpg"],
  hostelId: "hostel-1",
  hostel: {
    id: "hostel-1",
    slug: "green-view",
    name: "Green View",
    ownerId: "owner-1",
    city: "Lahore",
    area: "Gulberg",
    address: "123 Main Road",
    cancellationPolicy: "STANDARD",
    images: ["https://images.hostello.test/hostel-exterior.jpg"],
  },
};

function context(slug = "green-view", roomId = "room-gv-1") {
  return { params: Promise.resolve({ slug, roomId }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.room.findFirst).mockResolvedValue(room as never);
});

describe("room details page", () => {
  it("loads the room only under an active hostel and shows room-specific media and facilities", async () => {
    const page = await RoomDetailsPage(context());
    const markup = renderToStaticMarkup(page);

    expect(db.room.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "room-gv-1",
        hostel: { is: { slug: "green-view", status: "ACTIVE" } },
      },
    }));
    expect(markup).toContain("https://images.hostello.test/standard-room.jpg");
    expect(markup).not.toContain("hostel-exterior.jpg");
    expect(markup).toContain("Two single beds");
    expect(markup).toContain("Shared bathroom");
    expect(markup).toContain("Standard Double");
    expect(markup).toContain('aria-label="room booking"');
    expect(markup).toContain("hostel-detail-shell--hero");
  });

  it("returns not found when the requested room does not belong to an active hostel", async () => {
    vi.mocked(db.room.findFirst).mockResolvedValue(null);

    await expect(RoomDetailsPage(context())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rejects oversized route parameters before querying the database", async () => {
    await expect(RoomDetailsPage(context("x".repeat(201)))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(db.room.findFirst).not.toHaveBeenCalled();
  });
});
