import { Prisma } from "@/generated/client";
import type { RoomTypeInput } from "@/lib/validations";

type RoomInventoryConflictReason =
  | "UNKNOWN_ROOM"
  | "ROOM_HAS_BOOKINGS"
  | "CAPACITY_BELOW_RESERVED"
  | "ROOM_CHANGED";

export class RoomInventoryConflictError extends Error {
  constructor(readonly reason: RoomInventoryConflictReason) {
    super("Room inventory conflicts with existing bookings.");
    this.name = "RoomInventoryConflictError";
  }
}

export async function syncHostelRooms(
  client: Pick<Prisma.TransactionClient, "room">,
  hostelId: string,
  roomTypes: RoomTypeInput[],
) {
  const existingRooms = await client.room.findMany({
    where: { hostelId },
    select: {
      id: true,
      capacity: true,
      available: true,
      version: true,
      _count: { select: { bookings: true } },
    },
  });
  const existingById = new Map(existingRooms.map((room) => [room.id, room]));

  for (const room of roomTypes) {
    if (room.id && !existingById.has(room.id)) {
      throw new RoomInventoryConflictError("UNKNOWN_ROOM");
    }
  }

  const incomingIds = new Set(roomTypes.flatMap((room) => room.id ? [room.id] : []));
  const removedRooms = existingRooms.filter((room) => !incomingIds.has(room.id));
  if (removedRooms.some((room) => room._count.bookings > 0)) {
    throw new RoomInventoryConflictError("ROOM_HAS_BOOKINGS");
  }

  const updates = roomTypes.flatMap((room) => {
    if (!room.id) return [];
    const existing = existingById.get(room.id);
    if (!existing) throw new RoomInventoryConflictError("UNKNOWN_ROOM");

    const reserved = Math.max(0, existing.capacity - existing.available);
    if (room.capacity < reserved) {
      throw new RoomInventoryConflictError("CAPACITY_BELOW_RESERVED");
    }

    return [{
      room,
      existing,
      available: room.capacity === existing.capacity
        ? Math.min(existing.available, room.capacity)
        : room.capacity - reserved,
    }];
  });

  for (const { room, existing, available } of updates) {
    const updated = await client.room.updateMany({
      where: { id: existing.id, hostelId, version: existing.version },
      data: {
        name: room.name,
        description: room.description ?? null,
        pricePerMonth: room.pricePerMonth,
        capacity: room.capacity,
        available,
        images: room.images,
        facilities: room.facilities,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new RoomInventoryConflictError("ROOM_CHANGED");
    }
  }

  const newRooms = roomTypes.filter((room) => !room.id);
  if (newRooms.length) {
    await client.room.createMany({
      data: newRooms.map((room) => ({
        hostelId,
        name: room.name,
        description: room.description ?? null,
        pricePerMonth: room.pricePerMonth,
        capacity: room.capacity,
        available: room.capacity,
        images: room.images,
        facilities: room.facilities,
      })),
    });
  }

  if (removedRooms.length) {
    await client.room.deleteMany({
      where: {
        hostelId,
        id: { in: removedRooms.map((room) => room.id) },
      },
    });
  }
}
