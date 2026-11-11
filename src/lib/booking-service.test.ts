import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { $transaction: vi.fn() },
}));
vi.mock("@/lib/availability-alerts", () => ({
  reevaluateAvailabilityAlertsForHostel: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/lib/operational-logger", () => ({
  logOperationalEvent: vi.fn(),
}));

import { db } from "@/lib/db";
import { reevaluateAvailabilityAlertsForHostel } from "@/lib/availability-alerts";
import { logOperationalEvent } from "@/lib/operational-logger";
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
            minStay: 1,
            maxStay: null,
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

  it("rejects non-whole-month and over-cap stays before opening a transaction", async () => {
    await expect(createBooking(userId, bookingInput({
      checkIn: new Date("2099-06-01T00:00:00.000Z"),
      checkOut: new Date("2099-07-15T00:00:00.000Z"),
    }))).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("whole-month") });
    await expect(createBooking(userId, bookingInput({
      checkIn: new Date("2099-01-01T00:00:00.000Z"),
      checkOut: new Date("2101-02-01T00:00:00.000Z"),
    }))).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("24 months") });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["below the minimum", { minStay: 4, maxStay: null }],
    ["above the listing maximum", { minStay: 1, maxStay: 2 }],
  ])("rejects stays %s", async (_label, stayBounds) => {
    const tx = transaction({ hostel: {
      id: hostelId,
      name: "Green Valley Hostel",
      ownerId: "owner_1",
      status: "ACTIVE",
      pricePerMonth: 10_000,
      cancellationPolicy: "STANDARD",
      ...stayBounds,
    } });

    await expect(createBooking(userId, bookingInput()))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("minimum or maximum") });
    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it("reevaluates availability alerts after the inventory transaction commits", async () => {
    const tx = transaction();
    let committed = false;
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const result = await callback(tx);
      committed = true;
      return result;
    });
    vi.mocked(reevaluateAvailabilityAlertsForHostel).mockImplementation(async () => {
      expect(committed).toBe(true);
      return 0;
    });

    await createBooking(userId, bookingInput());

    expect(reevaluateAvailabilityAlertsForHostel).toHaveBeenCalledWith(hostelId);
  });

  it("returns the committed booking when alert reevaluation fails", async () => {
    const tx = transaction();
    let committed = false;
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const result = await callback(tx);
      committed = true;
      return result;
    });
    vi.mocked(reevaluateAvailabilityAlertsForHostel).mockRejectedValueOnce(
      Object.assign(new Error("private database detail"), { code: "P2034" }),
    );

    await expect(createBooking(userId, bookingInput())).resolves.toMatchObject({
      id: "booking_1",
    });

    expect(committed).toBe(true);
    expect(logOperationalEvent).toHaveBeenCalledWith(
      "error",
      "booking.availability_alerts.reevaluation_failed",
      { error_name: "Error", error_code: "P2034" },
    );
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
