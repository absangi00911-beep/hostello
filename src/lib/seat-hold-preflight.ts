import { Prisma } from "@/generated/client";

export type SeatHoldPreflightCandidate = {
  bookingId: string;
  status: string;
  bookingHostelId: string;
  roomId: string | null;
  roomHostelId: string | null;
  roomCapacity: number | null;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
};

export type SeatHoldPreflightCounts = {
  activeBookings: number;
  backfillableBookings: number;
  seatHoldsToBackfill: number;
  unresolvedBookings: number;
  roomlessBookings: number;
  invalidDateBookings: number;
  invalidGuestCounts: number;
  unknownRooms: number;
  invalidRoomCapacities: number;
  roomHostelMismatches: number;
  overCapacityRooms: number;
};

export type SeatHoldPreflightReport = {
  ready: boolean;
  counts: SeatHoldPreflightCounts;
};

type ValidCandidate = SeatHoldPreflightCandidate & {
  checkInDate: string;
  checkOutDate: string;
  roomId: string;
  roomCapacity: number;
};

function toDateKey(value: Date | string): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
      ? value
      : null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}

function hasCapacityConflict(bookings: ValidCandidate[], capacity: number): boolean {
  const events = new Map<string, number>();
  for (const booking of bookings) {
    events.set(booking.checkInDate, (events.get(booking.checkInDate) ?? 0) + booking.guests);
    events.set(booking.checkOutDate, (events.get(booking.checkOutDate) ?? 0) - booking.guests);
  }

  let demand = 0;
  for (const day of [...events.keys()].sort()) {
    demand += events.get(day)!;
    if (demand > capacity) return true;
  }
  return false;
}

export function analyzeSeatHoldPreflight(
  candidates: SeatHoldPreflightCandidate[],
  asOf: Date | string,
): SeatHoldPreflightReport {
  const today = toDateKey(asOf);
  if (!today) throw new Error("Seat-hold preflight requires a valid current date.");

  const active = candidates.filter(
    (candidate) => candidate.status === "PENDING" || candidate.status === "CONFIRMED",
  );
  const unresolvedBookingIds = new Set<string>();
  const counts: SeatHoldPreflightCounts = {
    activeBookings: 0,
    backfillableBookings: 0,
    seatHoldsToBackfill: 0,
    unresolvedBookings: 0,
    roomlessBookings: 0,
    invalidDateBookings: 0,
    invalidGuestCounts: 0,
    unknownRooms: 0,
    invalidRoomCapacities: 0,
    roomHostelMismatches: 0,
    overCapacityRooms: 0,
  };
  const validBookings: ValidCandidate[] = [];

  for (const candidate of active) {
    const checkOutDate = toDateKey(candidate.checkOut);
    if (checkOutDate && checkOutDate <= today) continue;

    counts.activeBookings++;
    let unresolved = false;
    const markUnresolved = () => {
      unresolved = true;
      unresolvedBookingIds.add(candidate.bookingId);
    };

    if (!candidate.roomId) {
      counts.roomlessBookings++;
      markUnresolved();
    } else if (!candidate.roomHostelId) {
      counts.unknownRooms++;
      markUnresolved();
    } else if (candidate.roomHostelId !== candidate.bookingHostelId) {
      counts.roomHostelMismatches++;
      markUnresolved();
    }

    const checkInDate = toDateKey(candidate.checkIn);
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      counts.invalidDateBookings++;
      markUnresolved();
    }

    if (!Number.isInteger(candidate.guests) || candidate.guests <= 0) {
      counts.invalidGuestCounts++;
      markUnresolved();
    }

    if (!Number.isInteger(candidate.roomCapacity) || (candidate.roomCapacity ?? 0) <= 0) {
      if (candidate.roomId && candidate.roomHostelId) {
        counts.invalidRoomCapacities++;
        markUnresolved();
      }
    }

    if (
      !unresolved &&
      candidate.roomId &&
      checkInDate &&
      checkOutDate &&
      candidate.roomCapacity
    ) {
      validBookings.push({
        ...candidate,
        roomId: candidate.roomId,
        roomCapacity: candidate.roomCapacity,
        checkInDate,
        checkOutDate,
      });
    }
  }

  const bookingsByRoom = new Map<string, ValidCandidate[]>();
  for (const booking of validBookings) {
    const roomBookings = bookingsByRoom.get(booking.roomId) ?? [];
    roomBookings.push(booking);
    bookingsByRoom.set(booking.roomId, roomBookings);
  }

  for (const roomBookings of bookingsByRoom.values()) {
    const capacity = roomBookings[0].roomCapacity;
    if (hasCapacityConflict(roomBookings, capacity)) {
      counts.overCapacityRooms++;
      for (const booking of roomBookings) unresolvedBookingIds.add(booking.bookingId);
      continue;
    }

    counts.backfillableBookings += roomBookings.length;
    counts.seatHoldsToBackfill += roomBookings.reduce((total, booking) => total + booking.guests, 0);
  }

  counts.unresolvedBookings = unresolvedBookingIds.size;
  return { ready: counts.unresolvedBookings === 0, counts };
}

type PreflightReader = Pick<Prisma.TransactionClient, "$queryRaw">;

type PreflightToday = { today: string };

export async function runSeatHoldPreflight(
  client: PreflightReader,
): Promise<SeatHoldPreflightReport> {
  const [{ today }] = await client.$queryRaw<PreflightToday[]>`
    SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today
  `;
  const candidates = await client.$queryRaw<SeatHoldPreflightCandidate[]>`
    SELECT
      b.id AS "bookingId",
      b.status::text AS status,
      b."hostelId" AS "bookingHostelId",
      b."roomId",
      r."hostelId" AS "roomHostelId",
      r.capacity AS "roomCapacity",
      to_char(b."checkIn"::date, 'YYYY-MM-DD') AS "checkIn",
      to_char(b."checkOut"::date, 'YYYY-MM-DD') AS "checkOut",
      b.guests
    FROM "bookings" b
    LEFT JOIN "rooms" r ON r.id = b."roomId"
    WHERE b.status::text IN ('PENDING', 'CONFIRMED')
      AND (NOT isfinite(b."checkOut") OR b."checkOut"::date > CURRENT_DATE)
    ORDER BY b."roomId" NULLS FIRST, b."checkIn", b."checkOut", b.id
  `;

  return analyzeSeatHoldPreflight(candidates, today);
}
