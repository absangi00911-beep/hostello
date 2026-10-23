import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/client";
import type { RoomTypeInput } from "@/lib/validations";
import { RoomInventoryConflictError, syncHostelRooms } from "./room-inventory-service";

const existingRoom = {
  id: "room_1",
  capacity: 4,
  available: 2,
  version: 3,
  _count: { bookings: 1 },
};

function inventoryClient(rooms = [existingRoom]) {
  return {
    room: {
      findMany: vi.fn().mockResolvedValue(rooms),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: "room_new" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  } as unknown as Pick<Prisma.TransactionClient, "room">;
}

function roomInput(overrides: Partial<RoomTypeInput> = {}): RoomTypeInput {
  return {
    id: "room_1",
    name: "Private room",
    description: "Quiet room with a study desk.",
    pricePerMonth: 32_000,
    capacity: 5,
    facilities: ["Attached bathroom", "Study desk"],
    images: ["https://images.hostello.test/private-room.jpg"],
    ...overrides,
  };
}

describe("syncHostelRooms", () => {
  it("updates a room in place and preserves its reserved capacity", async () => {
    const client = inventoryClient();

    await syncHostelRooms(client, "hostel_1", [roomInput()]);

    expect(client.room.updateMany).toHaveBeenCalledWith({
      where: { id: "room_1", hostelId: "hostel_1", version: 3 },
      data: {
        name: "Private room",
        description: "Quiet room with a study desk.",
        pricePerMonth: 32_000,
        capacity: 5,
        available: 3,
        images: ["https://images.hostello.test/private-room.jpg"],
        facilities: ["Attached bathroom", "Study desk"],
        version: { increment: 1 },
      },
    });
    expect(client.room.create).not.toHaveBeenCalled();
    expect(client.room.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects a capacity reduction below already reserved seats", async () => {
    const client = inventoryClient();

    await expect(
      syncHostelRooms(client, "hostel_1", [roomInput({ capacity: 1 })]),
    ).rejects.toBeInstanceOf(RoomInventoryConflictError);

    expect(client.room.updateMany).not.toHaveBeenCalled();
  });

  it("does not remove a room that has booking history", async () => {
    const client = inventoryClient();

    await expect(syncHostelRooms(client, "hostel_1", [])).rejects.toMatchObject({
      reason: "ROOM_HAS_BOOKINGS",
    });

    expect(client.room.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects room IDs that do not belong to the hostel inventory", async () => {
    const client = inventoryClient();

    await expect(
      syncHostelRooms(client, "hostel_1", [roomInput({ id: "room_other" })]),
    ).rejects.toMatchObject({ reason: "UNKNOWN_ROOM" });

    expect(client.room.updateMany).not.toHaveBeenCalled();
  });
});
