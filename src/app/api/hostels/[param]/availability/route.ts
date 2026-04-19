import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from "date-fns";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const { param } = await params;

    const hostel = await db.hostel.findUnique({
      where: { slug: param },
      select: { id: true, capacity: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => addMonths(now, i));

    // Fetch all confirmed / pending bookings in this window
    const windowStart = startOfMonth(months[0]);
    const windowEnd = endOfMonth(months[11]);

    const bookings = await db.booking.findMany({
      where: {
        hostelId: hostel.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lte: windowEnd },
        checkOut: { gte: windowStart },
      },
      select: { checkIn: true, checkOut: true, guests: true },
    });

    // For each month, count how many beds are occupied per day and average
    const calendar = months.map((month) => {
      const days = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      });

      const dailyOccupancy = days.map((day) => {
        const occupied = bookings
          .filter((b) => b.checkIn <= day && b.checkOut > day)
          .reduce((sum, b) => sum + b.guests, 0);
        return Math.min(occupied, hostel.capacity);
      });

      const avgOccupied =
        dailyOccupancy.reduce((a, b) => a + b, 0) / dailyOccupancy.length;
      const rate = hostel.capacity > 0 ? avgOccupied / hostel.capacity : 0;

      return {
        month: month.toISOString().slice(0, 7), // "2025-01"
        occupancyRate: Math.round(rate * 100),  // 0–100
        available: hostel.capacity - Math.round(avgOccupied),
      };
    });

    return NextResponse.json({ data: calendar });
  } catch (err) {
    console.error("[GET /api/hostels/[param]/availability]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
