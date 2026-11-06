import { describe, expect, it, vi } from "vitest";
import { analyzeSeatHoldPreflight, runSeatHoldPreflight } from "./seat-hold-preflight";

const today = "2030-01-01";

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    bookingId: "booking-private-1",
    status: "PENDING",
    bookingHostelId: "hostel-1",
    roomId: "room-1",
    roomHostelId: "hostel-1",
    roomCapacity: 2,
    checkIn: "2030-02-01",
    checkOut: "2030-02-04",
    guests: 1,
    ...overrides,
  };
}

describe("analyzeSeatHoldPreflight", () => {
  it("blocks future active bookings that have no room assignment", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ roomId: null, roomHostelId: null, roomCapacity: null }),
    ], today);

    expect(report.counts).toMatchObject({
      activeBookings: 1,
      roomlessBookings: 1,
      unresolvedBookings: 1,
      backfillableBookings: 0,
    });
  });

  it("blocks invalid date ranges and guest counts without returning booking identifiers", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({
        bookingId: "private-invalid-date",
        checkOut: "2030-02-01",
        studentName: "Sensitive Student",
        studentEmail: "student-private@example.test",
      }),
      candidate({ bookingId: "private-infinite-date", checkOut: "infinity" }),
      candidate({ bookingId: "private-invalid-guests", guests: 0 }),
    ], today);

    expect(report.counts).toMatchObject({
      invalidDateBookings: 2,
      invalidGuestCounts: 1,
      unresolvedBookings: 3,
    });
    expect(JSON.stringify(report)).not.toContain("private-");
    expect(JSON.stringify(report)).not.toContain("Sensitive Student");
    expect(JSON.stringify(report)).not.toContain("student-private@example.test");
  });

  it("blocks room assignments whose room belongs to a different hostel", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ roomHostelId: "different-hostel" }),
    ], today);

    expect(report.counts).toMatchObject({
      roomHostelMismatches: 1,
      unresolvedBookings: 1,
    });
  });

  it("blocks missing rooms and invalid room capacities", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ roomHostelId: null, roomCapacity: null }),
      candidate({ bookingId: "private-invalid-room", roomCapacity: 0 }),
    ], today);

    expect(report.counts).toMatchObject({
      unknownRooms: 1,
      invalidRoomCapacities: 1,
      unresolvedBookings: 2,
    });
  });

  it("blocks aggregate overlapping guest demand above a room's capacity", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ bookingId: "private-a", guests: 2, roomCapacity: 3 }),
      candidate({ bookingId: "private-b", guests: 2, roomCapacity: 3 }),
    ], today);

    expect(report.counts).toMatchObject({
      overCapacityRooms: 1,
      unresolvedBookings: 2,
      backfillableBookings: 0,
      seatHoldsToBackfill: 0,
    });
  });

  it("accepts clean inventory and treats checkout/start on the same date as non-overlapping", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ bookingId: "private-a", roomCapacity: 1, checkOut: "2030-02-04" }),
      candidate({
        bookingId: "private-b",
        roomCapacity: 1,
        checkIn: "2030-02-04",
        checkOut: "2030-02-08",
        status: "CONFIRMED",
      }),
    ], today);

    expect(report.counts).toMatchObject({
      activeBookings: 2,
      backfillableBookings: 2,
      seatHoldsToBackfill: 2,
      unresolvedBookings: 0,
      overCapacityRooms: 0,
    });
    expect(report.ready).toBe(true);
  });

  it("ignores bookings outside the active future-checkout set", () => {
    const report = analyzeSeatHoldPreflight([
      candidate({ status: "CANCELLED" }),
      candidate({ bookingId: "private-past", checkOut: today }),
    ], today);

    expect(report.counts).toMatchObject({
      activeBookings: 0,
      unresolvedBookings: 0,
      backfillableBookings: 0,
    });
    expect(report.ready).toBe(true);
  });

  it("uses read-only, minimized booking fields and returns only aggregate counts", async () => {
    const queryRaw = vi.fn()
      .mockResolvedValueOnce([{ today }])
      .mockResolvedValueOnce([{
        bookingId: "private-booking-id",
        status: "CONFIRMED",
        bookingHostelId: "hostel-1",
        roomId: "room-1",
        roomHostelId: "hostel-1",
        roomCapacity: 2,
        checkIn: new Date("2030-02-01T00:00:00.000Z"),
        checkOut: new Date("2030-02-04T00:00:00.000Z"),
        guests: 1,
      }]);

    const report = await runSeatHoldPreflight({ $queryRaw: queryRaw as never });
    const sql = queryRaw.mock.calls.map(([template]) => Array.from(template as TemplateStringsArray).join("")).join(" ");

    expect(report.counts).toMatchObject({ activeBookings: 1, seatHoldsToBackfill: 1 });
    expect(JSON.stringify(report)).not.toContain("private-booking-id");
    expect(sql).toMatch(/status::text\s+IN\s*\('PENDING',\s*'CONFIRMED'\)/i);
    expect(sql).toMatch(/NOT\s+isfinite\(b\."checkOut"\)/i);
    expect(sql).toMatch(/to_char\(CURRENT_DATE,\s*'YYYY-MM-DD'\)/i);
    expect(sql).toMatch(/to_char\(b\."checkIn"::date/i);
    expect(sql).not.toMatch(/student|email|userId|ownerId/i);
  });
});
