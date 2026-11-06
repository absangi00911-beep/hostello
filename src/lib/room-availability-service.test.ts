import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/client";
import {
  createOwnerBlockedDate,
  createSeatHolds,
  getHostelStayAvailability,
  getRoomStayAvailability,
  lockHostelInventory,
  releaseSeatHolds,
} from "./room-availability-service";

const checkIn = new Date("2099-04-10T00:00:00.000Z");
const checkOut = new Date("2099-04-14T00:00:00.000Z");

function inventoryClient(overrides: {
  rooms?: Array<{ id: string; capacity: number }>;
  holds?: Array<{ seatNo: number }>;
  block?: { id: string } | null;
} = {}) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ id: "hostel_1" }]),
    room: {
      findMany: vi.fn().mockResolvedValue(overrides.rooms ?? [{ id: "room_1", capacity: 4 }]),
    },
    seatHold: {
      findMany: vi.fn().mockResolvedValue(overrides.holds ?? []),
      findFirst: vi.fn().mockResolvedValue(null),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    blockedDate: {
      findFirst: vi.fn().mockResolvedValue(overrides.block ?? null),
      create: vi.fn().mockResolvedValue({
        id: "block_1",
        startDate: checkIn,
        endDate: checkOut,
        reason: "Repairs",
      }),
    },
  } as unknown as Pick<
    Prisma.TransactionClient,
    "$queryRaw" | "room" | "seatHold" | "blockedDate"
  >;
}

describe("room availability transaction service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads only seat holds that overlap the whole requested half-open stay", async () => {
    const client = inventoryClient({ holds: [{ seatNo: 1 }, { seatNo: 4 }] });

    await expect(getRoomStayAvailability(client, {
      hostelId: "hostel_1",
      roomId: "room_1",
      capacity: 4,
      checkIn,
      checkOut,
      guests: 2,
    })).resolves.toEqual({
      capacity: 4,
      availableSeats: 2,
      availableSeatNumbers: [2, 3],
      fits: true,
      blocked: false,
    });

    expect(client.seatHold.findMany).toHaveBeenCalledWith({
      where: {
        roomId: "room_1",
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { seatNo: true },
    });
  });

  it("treats owner block end dates as inclusive when testing a stay", async () => {
    const client = inventoryClient();

    await getRoomStayAvailability(client, {
      hostelId: "hostel_1",
      roomId: "room_1",
      capacity: 4,
      checkIn,
      checkOut,
      guests: 1,
    });

    expect(client.blockedDate.findFirst).toHaveBeenCalledWith({
      where: {
        hostelId: "hostel_1",
        startDate: { lt: checkOut },
        endDate: { gte: checkIn },
      },
      select: { id: true },
    });
  });

  it("reports zero whole-stay seats when any date is blocked", async () => {
    const client = inventoryClient({ block: { id: "block_1" } });

    await expect(getRoomStayAvailability(client, {
      hostelId: "hostel_1",
      roomId: "room_1",
      capacity: 4,
      checkIn,
      checkOut,
      guests: 1,
    })).resolves.toEqual({
      capacity: 4,
      availableSeats: 0,
      availableSeatNumbers: [],
      fits: false,
      blocked: true,
    });
  });

  it("uses seat holds for every room in exact-range availability", async () => {
    const client = inventoryClient({
      rooms: [
        { id: "room_1", capacity: 2 },
        { id: "room_2", capacity: 3 },
      ],
      holds: [{ roomId: "room_1", seatNo: 1 }],
    });

    const result = await getHostelStayAvailability(client, {
      hostelId: "hostel_1",
      checkIn,
      checkOut,
      guests: 2,
    });

    expect(client.room.findMany).toHaveBeenCalledWith({
      where: { hostelId: "hostel_1" },
      orderBy: { id: "asc" },
      select: { id: true, capacity: true },
    });
    expect(client.seatHold.findMany).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { roomId: "room_1", capacity: 2, availableSeats: 1, fits: false },
      { roomId: "room_2", capacity: 3, availableSeats: 3, fits: true },
    ]);
  });

  it("takes the shared availability lock before locking listing and room state", async () => {
    const client = inventoryClient();

    await lockHostelInventory(client, "hostel_1");

    const calls = vi.mocked(client.$queryRaw).mock.calls;
    expect(calls).toHaveLength(3);
    expect((calls[0][0] as { values: unknown[] }).values).toHaveLength(2);
    expect((calls[1][0] as { values: unknown[] }).values).toContain("hostel_1");
    expect((calls[2][0] as { values: unknown[] }).values).toContain("hostel_1");
  });

  it("creates an inclusive owner block through the shared inventory transaction path", async () => {
    const client = inventoryClient();

    await expect(createOwnerBlockedDate(client, {
      hostelId: "hostel_1",
      ownerId: "owner_1",
      startDate: checkIn,
      endDate: checkOut,
      reason: "Repairs",
    })).resolves.toMatchObject({ kind: "created" });

    expect(client.seatHold.findFirst).toHaveBeenCalledWith({
      where: {
        room: { is: { hostelId: "hostel_1" } },
        checkIn: { lt: new Date("2099-04-15T00:00:00.000Z") },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    });
  });

  it("does not create an owner block across an active hold", async () => {
    const client = inventoryClient();
    client.seatHold.findFirst.mockResolvedValue({ id: "hold_1" });

    await expect(createOwnerBlockedDate(client, {
      hostelId: "hostel_1",
      ownerId: "owner_1",
      startDate: checkIn,
      endDate: checkOut,
      reason: null,
    })).resolves.toEqual({ kind: "conflict" });
    expect(client.blockedDate.create).not.toHaveBeenCalled();
  });

  it("creates one seat hold per requested guest seat", async () => {
    const client = inventoryClient();

    await createSeatHolds(client, {
      bookingId: "booking_1",
      roomId: "room_1",
      checkIn,
      checkOut,
      seatNumbers: [2, 4],
    });

    expect(client.seatHold.createMany).toHaveBeenCalledWith({
      data: [
        { bookingId: "booking_1", roomId: "room_1", checkIn, checkOut, seatNo: 2 },
        { bookingId: "booking_1", roomId: "room_1", checkIn, checkOut, seatNo: 4 },
      ],
    });
  });

  it("releases a booking's seat holds within the caller's transaction", async () => {
    const client = inventoryClient();

    await releaseSeatHolds(client, "booking_1");

    expect(client.seatHold.deleteMany).toHaveBeenCalledWith({
      where: { bookingId: "booking_1" },
    });
  });
});
