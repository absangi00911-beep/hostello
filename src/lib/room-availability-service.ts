import { Prisma } from "@/generated/client";
import type { Prisma as PrismaTypes } from "@/generated/client";

type InventoryClient = Pick<
  PrismaTypes.TransactionClient,
  "$queryRaw" | "room" | "seatHold" | "blockedDate"
>;
type InventoryLockClient = Pick<PrismaTypes.TransactionClient, "$queryRaw">;
type BlockClient = Pick<
  PrismaTypes.TransactionClient,
  "$queryRaw" | "seatHold" | "blockedDate"
>;
type ExactStayClient = Pick<
  PrismaTypes.TransactionClient,
  "room" | "seatHold" | "blockedDate"
>;

type StayRange = {
  hostelId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
};

type RoomStayRange = StayRange & {
  roomId: string;
  capacity: number;
};

const AVAILABILITY_LOCK_NAMESPACE = 1_214_867_536;

// Inventory transactions take per-hostel advisory locks before any row locks.
export async function lockAvailabilityInventory(
  client: InventoryLockClient,
  hostelIds: string | readonly string[],
) {
  const ids = [...new Set(typeof hostelIds === "string" ? [hostelIds] : hostelIds)]
    .sort();
  for (const hostelId of ids) {
    await client.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${hostelId}, ${AVAILABILITY_LOCK_NAMESPACE}))`,
    );
  }
}

function summarizeRoomAvailability(
  capacity: number,
  seatNumbers: Iterable<number>,
  blocked: boolean,
  guests: number,
) {
  const occupied = new Set(seatNumbers);
  const availableSeatNumbers = blocked
    ? []
    : Array.from({ length: Math.max(0, capacity) }, (_, index) => index + 1)
      .filter((seatNo) => !occupied.has(seatNo));
  const availableSeats = availableSeatNumbers.length;

  return {
    capacity,
    availableSeats,
    availableSeatNumbers,
    fits: !blocked && availableSeats >= guests,
    blocked,
  };
}

export async function lockHostelInventory(client: InventoryLockClient, hostelId: string) {
  await lockAvailabilityInventory(client, hostelId);
  const hostels = await client.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "hostels" WHERE "id" = ${hostelId} FOR UPDATE`,
  );
  if (hostels.length === 0) return false;

  await client.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "rooms" WHERE "hostelId" = ${hostelId} ORDER BY "id" FOR UPDATE`,
  );
  return true;
}

export async function getAvailableHostelIdsForStay(
  client: ExactStayClient,
  input: {
    hostelIds: string[];
    checkIn: Date;
    checkOut: Date;
    guests: number;
  },
) {
  const hostelIds = [...new Set(input.hostelIds)];
  if (hostelIds.length === 0) return new Set<string>();

  const rooms = await client.room.findMany({
    where: { hostelId: { in: hostelIds } },
    orderBy: { id: "asc" },
    select: { id: true, hostelId: true, capacity: true },
  });
  if (rooms.length === 0) return new Set<string>();

  const roomIds = rooms.map((room) => room.id);
  const [holds, blocks] = await Promise.all([
    client.seatHold.findMany({
      where: {
        roomId: { in: roomIds },
        checkIn: { lt: input.checkOut },
        checkOut: { gt: input.checkIn },
      },
      select: { roomId: true, seatNo: true },
    }),
    client.blockedDate.findMany({
      where: {
        hostelId: { in: hostelIds },
        startDate: { lt: input.checkOut },
        endDate: { gte: input.checkIn },
      },
      select: { hostelId: true },
    }),
  ]);
  const seatsByRoom = new Map<string, number[]>();
  for (const hold of holds) {
    const seats = seatsByRoom.get(hold.roomId) ?? [];
    seats.push(hold.seatNo);
    seatsByRoom.set(hold.roomId, seats);
  }
  const blockedHostels = new Set(blocks.map((block) => block.hostelId));
  const availableHostels = new Set<string>();

  for (const room of rooms) {
    if (
      summarizeRoomAvailability(
        room.capacity,
        seatsByRoom.get(room.id) ?? [],
        blockedHostels.has(room.hostelId),
        input.guests,
      ).fits
    ) {
      availableHostels.add(room.hostelId);
    }
  }

  return availableHostels;
}

export async function createOwnerBlockedDate(
  client: BlockClient,
  input: {
    hostelId: string;
    ownerId: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
  },
) {
  if (!await lockHostelInventory(client, input.hostelId)) {
    return { kind: "missing" as const };
  }

  const endExclusive = new Date(input.endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const activeHold = await client.seatHold.findFirst({
    where: {
      room: { is: { hostelId: input.hostelId } },
      checkIn: { lt: endExclusive },
      checkOut: { gt: input.startDate },
    },
    select: { id: true },
  });
  if (activeHold) return { kind: "conflict" as const };

  const blocked = await client.blockedDate.create({
    data: {
      hostel: { connect: { id: input.hostelId, ownerId: input.ownerId } },
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    },
    select: { id: true, startDate: true, endDate: true, reason: true },
  });
  return { kind: "created" as const, blocked };
}

export async function getRoomStayAvailability(
  client: InventoryClient,
  range: RoomStayRange,
) {
  const [holds, block] = await Promise.all([
    client.seatHold.findMany({
      where: {
        roomId: range.roomId,
        checkIn: { lt: range.checkOut },
        checkOut: { gt: range.checkIn },
      },
      select: { seatNo: true },
    }),
    client.blockedDate.findFirst({
      where: {
        hostelId: range.hostelId,
        startDate: { lt: range.checkOut },
        endDate: { gte: range.checkIn },
      },
      select: { id: true },
    }),
  ]);

  return summarizeRoomAvailability(
    range.capacity,
    holds.map((hold) => hold.seatNo),
    Boolean(block),
    range.guests,
  );
}

export async function getHostelStayAvailability(
  client: InventoryClient,
  range: StayRange,
) {
  const rooms = await client.room.findMany({
    where: { hostelId: range.hostelId },
    orderBy: { id: "asc" },
    select: { id: true, capacity: true },
  });
  if (rooms.length === 0) return [];

  const [holds, block] = await Promise.all([
    client.seatHold.findMany({
      where: {
        roomId: { in: rooms.map((room) => room.id) },
        checkIn: { lt: range.checkOut },
        checkOut: { gt: range.checkIn },
      },
      select: { roomId: true, seatNo: true },
    }),
    client.blockedDate.findFirst({
      where: {
        hostelId: range.hostelId,
        startDate: { lt: range.checkOut },
        endDate: { gte: range.checkIn },
      },
      select: { id: true },
    }),
  ]);
  const seatsByRoom = new Map<string, number[]>();
  for (const hold of holds) {
    const seats = seatsByRoom.get(hold.roomId) ?? [];
    seats.push(hold.seatNo);
    seatsByRoom.set(hold.roomId, seats);
  }

  return rooms.map((room) => {
    const availability = summarizeRoomAvailability(
      room.capacity,
      seatsByRoom.get(room.id) ?? [],
      Boolean(block),
      range.guests,
    );
    return {
      roomId: room.id,
      capacity: availability.capacity,
      availableSeats: availability.availableSeats,
      fits: availability.fits,
    };
  });
}

export async function createSeatHolds(
  client: InventoryClient,
  input: {
    bookingId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    seatNumbers: number[];
  },
) {
  if (input.seatNumbers.length === 0) return;
  await client.seatHold.createMany({
    data: input.seatNumbers.map((seatNo) => ({
      bookingId: input.bookingId,
      roomId: input.roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      seatNo,
    })),
  });
}

export async function releaseSeatHolds(
  client: Pick<PrismaTypes.TransactionClient, "seatHold">,
  bookingId: string,
) {
  return client.seatHold.deleteMany({ where: { bookingId } });
}
