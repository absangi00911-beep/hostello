import { type NextRequest, NextResponse } from "next/server";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { fetchHostelSearchResults } from "@/lib/hostel-search-response";
import { isNearbyCoordinates } from "@/lib/nearby-search";
import { parsePagination } from "@/lib/pagination";
import { readBoundedJson } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { createOperationalLogContext } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_QUERY_LENGTH = 4_096;
const MAX_SEARCH_REQUESTS_PER_MINUTE = 120;
const MAX_SEARCH_GUESTS = 8;
const MAX_REQUEST_BODY_BYTES = 4_096;

interface NearbySearchBody {
  latitude: number;
  longitude: number;
  moveInDate?: string;
  guests?: number;
}

function isMoveInDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function isNearbySearchBody(value: unknown): value is NearbySearchBody {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !isNearbyCoordinates(value)
  ) {
    return false;
  }

  if (
    Object.keys(value).some(
      (key) => !["latitude", "longitude", "moveInDate", "guests"].includes(key),
    )
  ) {
    return false;
  }

  if ("moveInDate" in value && !isMoveInDate(value.moveInDate)) {
    return false;
  }
  if (
    "guests" in value &&
    (typeof value.guests !== "number" ||
      !Number.isInteger(value.guests) ||
      value.guests < 1 ||
      value.guests > MAX_SEARCH_GUESTS ||
      !("moveInDate" in value))
  ) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    if (req.nextUrl.search.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
    }

    const searchLimit = await rateLimit(`hostel-search:${getIp(req)}`, {
      limit: MAX_SEARCH_REQUESTS_PER_MINUTE,
      windowMs: 60 * 1000,
    });
    if (!searchLimit.ok) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((searchLimit.resetAt - Date.now()) / 1000))),
          },
        },
      );
    }

    const body = await readBoundedJson(req, MAX_REQUEST_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    if (!isNearbySearchBody(body.data)) {
      return NextResponse.json(
        { error: "Nearby search filters are invalid." },
        { status: 400 },
      );
    }

    const { page, limit } = parsePagination(req.nextUrl.searchParams, {
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });
    const moveInDate = body.data.moveInDate
      ? new Date(`${body.data.moveInDate}T00:00:00.000Z`)
      : undefined;
    const { hostelIds, total, isSearchDegraded } =
      await searchHostelsWithFallback(
        {
          nearby: {
            latitude: body.data.latitude,
            longitude: body.data.longitude,
          },
          moveInDate,
          guests: moveInDate ? body.data.guests ?? 1 : undefined,
          sort: "newest",
          page,
          limit,
        },
        createOperationalLogContext(req),
      );
    const hostels = await fetchHostelSearchResults(hostelIds);

    return NextResponse.json({
      data: hostels,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      isSearchDegraded,
    });
  } catch (error) {
    console.error("[POST /api/hostels/nearby]", getSafeErrorSummary(error));
    return NextResponse.json(
      { error: "Nearby search failed. Please try again." },
      { status: 500 },
    );
  }
}
