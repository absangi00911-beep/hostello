import { getSafeErrorSummary } from "@/lib/safe-error";
import { getPublicHostelDetail, projectPublicHostelDetail } from "@/lib/hostel-detail";
import {
  isBoundedRouteParam,
  MAX_HOSTEL_ROUTE_PARAM_LENGTH,
} from "@/lib/route-params";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { type NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
    }

    const limit = await rateLimit(`public-hostel:${getIp(req)}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many hostel detail requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))),
          },
        },
      );
    }

    const hostel = await getPublicHostelDetail(param);
    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    return NextResponse.json({
      data: projectPublicHostelDetail(hostel),
    });
  } catch (error) {
    console.error("[GET /api/hostels/[param]/public]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
