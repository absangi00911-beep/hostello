import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { hostel: { findFirst: mocks.findFirst } } }));

import { getOwnerListingForEdit } from "./owner-listing";

describe("getOwnerListingForEdit", () => {
  beforeEach(() => mocks.findFirst.mockReset());

  it("scopes the lookup by owner so other owners' listings are not found", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(getOwnerListingForEdit("owner1", "h1")).resolves.toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "h1", ownerId: "owner1" } }),
    );
  });

  it("renames the rooms relation to rooms", async () => {
    mocks.findFirst.mockResolvedValue({ id: "h1", status: "DRAFT", rooms_rel: [{ id: "r1" }] });

    const listing = await getOwnerListingForEdit("owner1", "h1");

    expect(listing?.rooms).toEqual([{ id: "r1" }]);
    expect(listing).not.toHaveProperty("rooms_rel");
  });

  it("rejects empty or oversized ids without querying", async () => {
    await expect(getOwnerListingForEdit("owner1", "")).resolves.toBeNull();
    await expect(getOwnerListingForEdit("owner1", "x".repeat(65))).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
