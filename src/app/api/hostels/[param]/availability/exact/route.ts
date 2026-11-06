import { getSafeErrorSummary } from "@/lib/safe-error";
import { type NextRequest, NextResponse } from "next/server";
import { exactAvailabilitySchema } from "@hostello/shared";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import {
  getHostelStayAvailability,
  lockAvailabilityInventory,
} from "@/lib/room-availability-service";
import { hostelIdOrSlugWhere } from "@/lib/hostel-service";
import {
  isBoundedRouteParam,
  MAX_HOSTEL_ROUTE_PARAM_LENGTH,
} from "@/lib/route-params";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> },
) {
  try {
    const { param } = await params;
    if (
      !isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH) ||
      req.nextUrl.search.length > 1_024
    ) {
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

    const data = await db.$transaction(
      async (tx) => {
        const where = hostelIdOrSlugWhere(param);
        const candidate = await tx.hostel.findFirst({
          where,
          select: { id: true },
        });
        if (!candidate) return null;
        await lockAvailabilityInventory(tx, candidate.id);
        const hostel = await tx.hostel.findFirst({
          where: { id: candidate.id, status: "ACTIVE" },
          select: { id: true },
        });
        if (!hostel) return null;
        return getHostelStayAvailability(tx, {
          hostelId: hostel.id,
          ...parsed.data,
        });
      },
      { isolationLevel: "ReadCommitted" },
    );
    if (!data) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/hostels/[param]/availability/exact]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
