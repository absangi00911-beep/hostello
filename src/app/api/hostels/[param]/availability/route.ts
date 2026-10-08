import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/hostels/[param]/availability/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from "date-fns";
import { getIp, rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const { param } = await params;
    if (param.length > 200) {
      return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
    }

    const limit = await rateLimit(`availability:${getIp(req)}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many availability requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const hostel = await db.hostel.findFirst({
      where: { slug: param, status: "ACTIVE" },
      select: { id: true, capacity: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    const hostelId = hostel.id;

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => addMonths(now, i));

    const windowStart = startOfMonth(months[0]);
    const windowEnd = endOfMonth(months[11]);

    const monthDays = months.map((month) =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    );
    const allDays = monthDays.flat();
    const occupiedByDay = new Map<number, number>();
    const blockedDays = new Set<number>();
    const bookingDeltas = new Array<number>(allDays.length + 1).fill(0);
    const blockedDeltas = new Array<number>(allDays.length + 1).fill(0);

    function findDayIndex(predicate: (day: Date) => boolean) {
      let low = 0;
      let high = allDays.length;

      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (predicate(allDays[middle])) high = middle;
        else low = middle + 1;
      }

      return low;
    }

    async function loadBookingOccupancy() {
      let cursor: string | undefined;

      while (true) {
        const bookings = await db.booking.findMany({
          where: {
            hostelId,
            status: { in: ["PENDING", "CONFIRMED"] },
            checkIn: { lte: windowEnd },
            checkOut: { gte: windowStart },
          },
          orderBy: [{ checkIn: "asc" }, { id: "asc" }],
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          take: 200,
          select: { id: true, checkIn: true, checkOut: true, guests: true },
        });

        for (const booking of bookings) {
          const startIndex = findDayIndex((day) => day >= booking.checkIn);
          const endIndex = findDayIndex((day) => day >= booking.checkOut);
          if (startIndex < endIndex) {
            bookingDeltas[startIndex] += booking.guests;
            bookingDeltas[endIndex] -= booking.guests;
          }
        }

        if (bookings.length < 200) break;
        cursor = bookings[bookings.length - 1].id;
      }
    }

    async function loadBlockedDays() {
      let cursor: string | undefined;

      while (true) {
        const blockedRanges = await db.blockedDate.findMany({
          where: {
            hostelId,
            startDate: { lte: windowEnd },
            endDate: { gte: windowStart },
          },
          orderBy: [{ startDate: "asc" }, { id: "asc" }],
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          take: 200,
          select: { id: true, startDate: true, endDate: true },
        });

        for (const blocked of blockedRanges) {
          const startIndex = findDayIndex((day) => day >= blocked.startDate);
          const endIndex = findDayIndex((day) => day > blocked.endDate);
          if (startIndex < endIndex) {
            blockedDeltas[startIndex] += 1;
            blockedDeltas[endIndex] -= 1;
          }
        }

        if (blockedRanges.length < 200) break;
        cursor = blockedRanges[blockedRanges.length - 1].id;
      }
    }

    await Promise.all([loadBookingOccupancy(), loadBlockedDays()]);

    let occupied = 0;
    let blockedCount = 0;
    for (let index = 0; index < allDays.length; index += 1) {
      occupied += bookingDeltas[index];
      blockedCount += blockedDeltas[index];
      const key = allDays[index].getTime();
      occupiedByDay.set(key, occupied);
      if (blockedCount > 0) blockedDays.add(key);
    }

    const calendar = months.map((month, index) => {
      const days = monthDays[index];
      const dailyOccupancy = days.map((day) =>
        blockedDays.has(day.getTime())
          ? hostel.capacity
          : Math.min(occupiedByDay.get(day.getTime()) ?? 0, hostel.capacity),
      );

      const avgOccupied =
        dailyOccupancy.reduce((a, b) => a + b, 0) / dailyOccupancy.length;
      const rate = hostel.capacity > 0 ? avgOccupied / hostel.capacity : 0;

      return {
        month: month.toISOString().slice(0, 7),
        occupancyRate: Math.round(rate * 100),
        available: hostel.capacity - Math.round(avgOccupied),
      };
    });

    return NextResponse.json({ data: calendar });
  } catch (err) {
    console.error("[GET /api/hostels/[param]/availability]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
