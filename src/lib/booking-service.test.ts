import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { $transaction: vi.fn() },
}));
vi.mock("@/lib/availability-alerts", () => ({
  reevaluateAvailabilityAlertsForHostel: vi.fn().mockResolvedValue(0),
}));

import { db } from "@/lib/db";
import { BookingServiceError, createBooking } from "./booking-service";

const userId = "usr_0000000000000000000001";
const hostelId = "hst_0000000000000000000001";
const roomId = "rm_00000000000000000000001";
const checkIn = new Date("2099-06-01T00:00:00.000Z");
const checkOut = new Date("2099-09-01T00:00:00.000Z");

function transaction(overrides: {
  hostel?: Record<string, unknown> | null;
  room?: Record<string, unknown> | null;
  holds?: Array<{ seatNo: number }>;
  block?: Record<string, unknown> | null;
} = {}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: hostelId }]),
    user: {
      findUnique: vi.fn().mockResolvedValue({ deletionRequestedAt: null }),
    },
    hostel: {
      findUnique: vi.fn().mockResolvedValue(overrides.hostel === undefined
        ? {
            id: hostelId,
            name: "Green Valley Hostel",
            ownerId: "owner_1",
            status: "ACTIVE",
            pricePerMonth: 10_000,
            cancellationPolicy: "STANDARD",
          }
        : overrides.hostel),
    },
    room: {
      findFirst: vi.fn().mockResolvedValue(overrides.room === undefined
        ? {
            id: roomId,
            hostelId,
            pricePerMonth: 12_000,
            capacity: 4,
          }
        : overrides.room),
    },
    seatHold: {
      findMany: vi.fn().mockResolvedValue(overrides.holds ?? []),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    blockedDate: {
      findFirst: vi.fn().mockResolvedValue(overrides.block ?? null),
    },
    booking: {
      create: vi.fn().mockResolvedValue({
        id: "booking_1",
        status: "PENDING",
        paymentStatus: "PENDING",
        hostel: { name: "Green Valley Hostel", ownerId: "owner_1" },
        user: { name: "Ali Khan" },
      }),
    },
  };
  vi.mocked(db.$transaction).mockImplementation(async (callback: any) => callback(tx));
  return tx;
}

function bookingInput(overrides: Record<string, unknown> = {}) {
  return {
    hostelId,
    roomId,
    checkIn,
    checkOut,
    guests: 1,
    paymentMethod: "safepay" as const,
    ...overrides,
  };
}

describe("createBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates listing, room, dates, guests, blocks, and capacity in one transaction", async () => {
    const tx = transaction({ holds: [{ seatNo: 1 }, { seatNo: 3 }] });

    await createBooking(userId, bookingInput({ guests: 2 }));

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(tx.hostel.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: hostelId },
    }));
    expect(tx.room.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: roomId, hostelId },
    }));
    expect(tx.blockedDate.findFirst).toHaveBeenCalledWith({
      where: {
        hostelId,
        startDate: { lt: checkOut },
        endDate: { gte: checkIn },
      },
      select: { id: true },
    });
    expect(tx.seatHold.createMany).toHaveBeenCalledWith({
      data: [
        { bookingId: "booking_1", roomId, checkIn, checkOut, seatNo: 2 },
        { bookingId: "booking_1", roomId, checkIn, checkOut, seatNo: 4 },
      ],
    });
  });

  it("persists calendar dates and charges the selected room price per guest-month", async () => {
    const tx = transaction();

    await createBooking(userId, bookingInput({ guests: 2 }));

    expect(tx.booking.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId,
        hostelId,
        roomId,
        checkIn,
        checkOut,
        months: 3,
        guests: 2,
        total: 72_000,
        status: "PENDING",
        paymentStatus: "PENDING",
      }),
    }));
  });

  it("returns an actionable conflict when the selected room no longer fits the guests", async () => {
    const tx = transaction({ holds: [{ seatNo: 1 }, { seatNo: 2 }, { seatNo: 3 }] });

    await expect(createBooking(userId, bookingInput({ guests: 2 })))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(tx.booking.create).not.toHaveBeenCalled();
    expect(tx.seatHold.createMany).not.toHaveBeenCalled();
  });

  it("rejects a booking when an inclusive owner block overlaps any stay date", async () => {
    const tx = transaction({ block: { id: "block_1" } });

    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("blocked") });
    expect(tx.booking.create).not.toHaveBeenCalled();
    expect(tx.seatHold.createMany).not.toHaveBeenCalled();
  });

  it("rejects missing or inactive listings and rooms without trusting an outside read", async () => {
    const missingHostel = transaction({ hostel: null });
    await expect(createBooking(userId, bookingInput()))
      .rejects.toBeInstanceOf(BookingServiceError);
    expect(missingHostel.hostel.findUnique).toHaveBeenCalled();

    vi.clearAllMocks();
    const inactiveHostel = transaction({ hostel: {
      id: hostelId,
      status: "SUSPENDED",
      cancellationPolicy: "STANDARD",
    } });
    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(inactiveHostel.room.findFirst).not.toHaveBeenCalled();

    vi.clearAllMocks();
    const missingRoom = transaction({ room: null });
    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(missingRoom.booking.create).not.toHaveBeenCalled();
  });

  it("rejects a booking when account deletion has been requested", async () => {
    const tx = transaction();
    tx.user.findUnique.mockResolvedValue({ deletionRequestedAt: new Date() });

    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it.each(["jazzcash", "easypaisa"])(
    "rejects disabled payment method %s before starting a transaction or creating a hold",
    async (paymentMethod) => {
      const tx = transaction();
      await expect(createBooking(
        userId,
        bookingInput({ paymentMethod }) as never,
      )).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("Payment method") });

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(tx.booking.create).not.toHaveBeenCalled();
      expect(tx.seatHold.createMany).not.toHaveBeenCalled();
    },
  );

  it("maps exclusion-constraint races to HTTP 409 instead of an internal error", async () => {
    const tx = transaction();
    tx.seatHold.createMany.mockRejectedValue(
      Object.assign(new Error("overlap"), { code: "P2004" }),
    );

    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
