import { Prisma } from "@/generated/client";
import type { Prisma as PrismaTypes } from "@/generated/client";

type InventoryClient = Pick<
  PrismaTypes.TransactionClient,
  "$queryRaw" | "room" | "seatHold" | "blockedDate"
>;
type InventoryLockClient = Pick<PrismaTypes.TransactionClient, "$queryRaw">;

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
  const hostels = await client.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "hostels" WHERE "id" = ${hostelId} FOR UPDATE`,
  );
  if (hostels.length === 0) return false;

  await client.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "rooms" WHERE "hostelId" = ${hostelId} ORDER BY "id" FOR UPDATE`,
  );
  return true;
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
