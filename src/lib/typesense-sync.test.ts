import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hostelFindUnique: vi.fn(),
  hostelFindMany: vi.fn(),
  indexHostel: vi.fn(),
  indexHostelsBatch: vi.fn(),
  removeHostelFromIndex: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { hostel: { findUnique: mocks.hostelFindUnique, findMany: mocks.hostelFindMany } },
}));
vi.mock("@/lib/typesense", () => ({
  indexHostel: mocks.indexHostel,
  indexHostelsBatch: mocks.indexHostelsBatch,
  removeHostelFromIndex: mocks.removeHostelFromIndex,
}));

import { hostelToTypesenseDocument, syncAllHostelsToTypesense } from "@/lib/typesense-sync";

function hostel(id: string) {
  return {
    id,
    name: `Hostel ${id}`,
    description: "Near campus",
    city: "Lahore",
    area: null,
    address: "Campus Road",
    pricePerMonth: 20_000,
    rooms: 10,
    capacity: 20,
    gender: "MIXED",
    amenities: ["wifi", "laundry"],
    rules: ["quiet hours"],
    verified: true,
    featured: false,
    rating: 4.5,
    reviewCount: 3,
    viewCount: 12,
    images: ["https://images.test/room.jpg"],
    coverImage: null,
    latitude: 31.5,
    longitude: 74.3,
    ownerId: "owner_1",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
    owner: { name: "Owner", avatar: null },
  };
}

describe("Typesense hostel synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.indexHostel.mockResolvedValue(undefined);
    mocks.indexHostelsBatch.mockResolvedValue([]);
  });

  it("converts one selected hostel row into a Typesense document", async () => {
    mocks.hostelFindUnique.mockResolvedValue(hostel("hst_1"));

    const document = await hostelToTypesenseDocument("hst_1");

    expect(document).toMatchObject({
      id: "hst_1",
      ownerName: "Owner",
      createdAt: Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000),
      searchText: "Hostel hst_1 Near campus Lahore Campus Road wifi laundry",
    });
    expect(mocks.hostelFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "hst_1" },
      select: expect.objectContaining({ id: true, owner: { select: { name: true, avatar: true } } }),
    }));
  });

  it("syncs active hostels in bounded keyset pages without per-row queries", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => hostel(`hst_${String(index + 1).padStart(3, "0")}`));
    const secondPage = [hostel("hst_101")];
    mocks.hostelFindMany.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    await syncAllHostelsToTypesense();

    expect(mocks.hostelFindMany).toHaveBeenCalledTimes(2);
    expect(mocks.hostelFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      take: 100,
    }));
    expect(mocks.hostelFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { status: "ACTIVE", id: { gt: "hst_100" } },
      orderBy: { id: "asc" },
      take: 100,
    }));
    expect(mocks.indexHostelsBatch).toHaveBeenCalledTimes(2);
    expect(mocks.indexHostelsBatch.mock.calls[0][0]).toHaveLength(100);
    expect(mocks.indexHostelsBatch.mock.calls[1][0]).toHaveLength(1);
    expect(mocks.hostelFindUnique).not.toHaveBeenCalled();
  });
});
