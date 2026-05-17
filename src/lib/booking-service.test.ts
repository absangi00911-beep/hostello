// Path: src/lib/booking-service.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findUnique: vi.fn() },
    room:   { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// calculateMonths is pure — use the real implementation
vi.mock("@/lib/utils", async (importOriginal) => {
  return importOriginal();
});

import { createBooking } from "./booking-service";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID   = "usr_0000000000000000000001";
const HOSTEL_ID = "hst_0000000000000000000001";
const ROOM_ID   = "rm_00000000000000000000001";
const OWNER_ID  = "usr_0000000000000000000002";
const BOOKING_ID = "bkg_0000000000000000000001";

const CHECK_IN  = "2026-06-01T00:00:00.000Z";
const CHECK_OUT = "2026-09-01T00:00:00.000Z"; // 3 months

function makeHostel(overrides = {}) {
  return {
    id:            HOSTEL_ID,
    name:          "Green Valley Hostel",
    ownerId:       OWNER_ID,
    status:        "ACTIVE",
    pricePerMonth: 10000,
    capacity:      20,
    ...overrides,
  };
}

function makeRoom(overrides = {}) {
  return {
    id:            ROOM_ID,
    hostelId:      HOSTEL_ID,
    name:          "Standard Room",
    pricePerMonth: 12000,
    capacity:      4,
    available:     2,
    version:       1,
    ...overrides,
  };
}

function makeBookingRecord(overrides = {}) {
  return {
    id:      BOOKING_ID,
    userId:  USER_ID,
    hostelId: HOSTEL_ID,
    roomId:  ROOM_ID,
    hostel:  { name: "Green Valley Hostel", ownerId: OWNER_ID },
    user:    { name: "Ali Khan" },
    total:   36000,
    months:  3,
    guests:  1,
    status:  "PENDING",
    paymentStatus: "PENDING",
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    hostelId:      HOSTEL_ID,
    roomId:        ROOM_ID,
    checkIn:       CHECK_IN,
    checkOut:      CHECK_OUT,
    guests:        1,
    paymentMethod: "safepay" as const,
    ...overrides,
  };
}

/** Build a transaction mock that executes the callback immediately */
function makeTx(overrides: {
  roomUpdate?: any;
  bookingCreate?: any;
} = {}) {
  const tx = {
    room: {
      update: vi.fn().mockResolvedValue(
        overrides.roomUpdate ?? makeRoom({ available: 1, version: 2 }),
      ),
    },
    booking: {
      create: vi.fn().mockResolvedValue(
        overrides.bookingCreate ?? makeBookingRecord(),
      ),
    },
  };
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(tx));
  return tx;
}

// ═════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ═════════════════════════════════════════════════════════════════════════════

describe("createBooking — happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(makeRoom() as any);
  });

  it("creates a booking and returns it", async () => {
    const tx = makeTx();
    const result = await createBooking(USER_ID, baseInput());

    expect(result).toMatchObject({ id: BOOKING_ID });
    expect(tx.booking.create).toHaveBeenCalledTimes(1);
  });

  it("calculates total correctly — price × months × guests", async () => {
    const tx = makeTx();
    // Room price 12000 × 3 months × 1 guest = 36000
    await createBooking(USER_ID, baseInput());

    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total:  36000,
          months: 3,
        }),
      }),
    );
  });

  it("uses room pricePerMonth when roomId is provided", async () => {
    const tx = makeTx();
    // Room is 12000/mo, hostel is 10000/mo — room wins
    await createBooking(USER_ID, baseInput());

    const createArg = tx.booking.create.mock.calls[0][0].data;
    expect(createArg.total).toBe(12000 * 3 * 1);
  });

  it("uses hostel pricePerMonth when no roomId provided", async () => {
    const tx = makeTx();
    await createBooking(USER_ID, baseInput({ roomId: undefined }));

    const createArg = tx.booking.create.mock.calls[0][0].data;
    expect(createArg.total).toBe(10000 * 3 * 1);
  });

  it("scales total by guest count", async () => {
    const tx = makeTx();
    vi.mocked(db.room.findUnique).mockResolvedValue(makeRoom({ available: 3 }) as any);
    await createBooking(USER_ID, baseInput({ guests: 2 }));

    const createArg = tx.booking.create.mock.calls[0][0].data;
    expect(createArg.total).toBe(12000 * 3 * 2);
  });

  it("uses optimistic lock — passes current room version in where clause", async () => {
    const room = makeRoom({ version: 7 });
    vi.mocked(db.room.findUnique).mockResolvedValue(room as any);
    const tx = makeTx();

    await createBooking(USER_ID, baseInput());

    expect(tx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ version: 7 }),
      }),
    );
  });

  it("increments room version after successful booking", async () => {
    const tx = makeTx();
    await createBooking(USER_ID, baseInput());

    expect(tx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: { increment: 1 },
        }),
      }),
    );
  });

  it("decrements room available by guest count", async () => {
    vi.mocked(db.room.findUnique).mockResolvedValue(makeRoom({ available: 3 }) as any);
    const tx = makeTx();

    await createBooking(USER_ID, baseInput({ guests: 2 }));

    expect(tx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          available: { decrement: 2 },
        }),
      }),
    );
  });

  it("creates booking with PENDING status and paymentStatus", async () => {
    const tx = makeTx();
    await createBooking(USER_ID, baseInput());

    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status:        "PENDING",
          paymentStatus: "PENDING",
        }),
      }),
    );
  });

  it("skips room update when no roomId provided", async () => {
    const tx = makeTx();
    await createBooking(USER_ID, baseInput({ roomId: undefined }));

    expect(tx.room.update).not.toHaveBeenCalled();
    expect(tx.booking.create).toHaveBeenCalled();
  });

  it("notifies owner after booking is created", async () => {
    makeTx();
    await createBooking(USER_ID, baseInput());

    // Allow fire-and-forget microtask to flush
    await new Promise((r) => setTimeout(r, 0));

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: OWNER_ID,
        type:   "BOOKING_REQUEST",
      }),
    );
  });

  it("notification failure does NOT throw or roll back", async () => {
    vi.mocked(createNotification).mockRejectedValue(new Error("FCM down"));
    makeTx();

    // Should resolve without throwing
    await expect(createBooking(USER_ID, baseInput())).resolves.toMatchObject({
      id: BOOKING_ID,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// OPTIMISTIC LOCKING — CONCURRENCY SIMULATION
// ═════════════════════════════════════════════════════════════════════════════

describe("createBooking — optimistic lock conflict", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
  });

  it("first of two concurrent bookings succeeds, second is rejected with version mismatch", async () => {
    // Room has 1 spot left — only ONE booking should succeed
    const room = makeRoom({ available: 1, version: 3 });
    vi.mocked(db.room.findUnique).mockResolvedValue(room as any);

    let transactionCount = 0;

    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      transactionCount++;

      if (transactionCount === 1) {
        // First transaction: room.update succeeds (version matches)
        const tx = {
          room: {
            update: vi.fn().mockResolvedValue(
              makeRoom({ available: 0, version: 4 }),
            ),
          },
          booking: {
            create: vi.fn().mockResolvedValue(makeBookingRecord()),
          },
        };
        return cb(tx);
      } else {
        // Second transaction: Prisma throws because version: 3 no longer exists
        // (first booking already incremented it to 4)
        const tx = {
          room: {
            update: vi.fn().mockRejectedValue(
              Object.assign(new Error("Record to update not found."), {
                code: "P2025",
              }),
            ),
          },
          booking: { create: vi.fn() },
        };
        return cb(tx);
      }
    });

    const input = baseInput();

    const [first, second] = await Promise.allSettled([
      createBooking(USER_ID, input),
      createBooking("usr_other_0000000000000001", input),
    ]);

    expect(first.status).toBe("fulfilled");
    expect(second.status).toBe("rejected");
  });

  it("throws 'Room became full' when available drops below 0 after decrement", async () => {
    const room = makeRoom({ available: 1, version: 1 });
    vi.mocked(db.room.findUnique).mockResolvedValue(room as any);

    // Transaction succeeds but leaves available at -1 (race: two guests took the last spot)
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        room: {
          update: vi.fn().mockResolvedValue(
            makeRoom({ available: -1, version: 2 }),
          ),
        },
        booking: { create: vi.fn() },
      };
      return cb(tx);
    });

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Room became full during booking",
    );
  });

  it("allows available === 0 exactly (last spot taken, not negative)", async () => {
    const room = makeRoom({ available: 1, version: 1 });
    vi.mocked(db.room.findUnique).mockResolvedValue(room as any);

    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        room: {
          update: vi.fn().mockResolvedValue(
            makeRoom({ available: 0, version: 2 }), // exactly 0 — valid
          ),
        },
        booking: {
          create: vi.fn().mockResolvedValue(makeBookingRecord()),
        },
      };
      return cb(tx);
    });

    await expect(createBooking(USER_ID, baseInput())).resolves.toMatchObject({
      id: BOOKING_ID,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ERROR PATHS — PRE-TRANSACTION GUARDS
// ═════════════════════════════════════════════════════════════════════════════

describe("createBooking — pre-transaction guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when hostel is not found", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(null);

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Hostel not found or not available",
    );
  });

  it("throws when hostel status is SUSPENDED", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(
      makeHostel({ status: "SUSPENDED" }) as any,
    );

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Hostel not found or not available",
    );
  });

  it("throws when hostel status is PENDING_REVIEW", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(
      makeHostel({ status: "PENDING_REVIEW" }) as any,
    );

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Hostel not found or not available",
    );
  });

  it("throws when room is not found in the given hostel", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(null);

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Selected room not found",
    );
    // Must not reach the transaction
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("throws when room has insufficient capacity for guest count", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(
      makeRoom({ available: 1 }) as any,
    );

    await expect(
      createBooking(USER_ID, baseInput({ guests: 3 })), // needs 3, only 1 available
    ).rejects.toThrow("Not enough capacity");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("throws when room has 0 available spots", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(
      makeRoom({ available: 0 }) as any,
    );

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow(
      "Not enough capacity",
    );
  });

  it("does not enter transaction when hostel guard fails", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(null);

    await expect(createBooking(USER_ID, baseInput())).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// MINIMUM STAY — calculateMonths clamps to 1
// ═════════════════════════════════════════════════════════════════════════════

describe("createBooking — month calculation edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(makeRoom() as any);
  });

  it("uses minimum 1 month even when dates are same month", async () => {
    const tx = makeTx();
    // Same month → calculateMonths returns 1
    await createBooking(USER_ID, baseInput({
      checkIn:  "2026-06-01T00:00:00.000Z",
      checkOut: "2026-06-28T00:00:00.000Z",
    }));

    const createArg = tx.booking.create.mock.calls[0][0].data;
    expect(createArg.months).toBe(1);
    expect(createArg.total).toBe(12000 * 1 * 1);
  });

  it("calculates 6 months correctly", async () => {
    const tx = makeTx();
    await createBooking(USER_ID, baseInput({
      checkIn:  "2026-01-01T00:00:00.000Z",
      checkOut: "2026-07-01T00:00:00.000Z",
    }));

    const createArg = tx.booking.create.mock.calls[0][0].data;
    expect(createArg.months).toBe(6);
    expect(createArg.total).toBe(12000 * 6 * 1);
  });
});