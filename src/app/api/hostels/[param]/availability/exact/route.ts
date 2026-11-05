import { getSafeErrorSummary } from "@/lib/safe-error";
import { type NextRequest, NextResponse } from "next/server";
import { exactAvailabilitySchema } from "@hostello/shared";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { getHostelStayAvailability } from "@/lib/room-availability-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> },
) {
  try {
    const { param } = await params;
    if (param.length > 200 || req.nextUrl.search.length > 1_024) {
      return NextResponse.json({ error: "Invalid availability request." }, { status: 400 });
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

    const parsed = exactAvailabilitySchema.safeParse({
      checkIn: req.nextUrl.searchParams.get("checkIn"),
      checkOut: req.nextUrl.searchParams.get("checkOut"),
      guests: req.nextUrl.searchParams.get("guests"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Provide a valid future stay and guest count." }, { status: 400 });
    }

    const hostel = await db.hostel.findFirst({
      where: { slug: param, status: "ACTIVE" },
      select: { id: true },
    });
    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    const data = await db.$transaction(
      (tx) => getHostelStayAvailability(tx, {
        hostelId: hostel.id,
        ...parsed.data,
      }),
      { isolationLevel: "RepeatableRead" },
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/hostels/[param]/availability/exact]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
