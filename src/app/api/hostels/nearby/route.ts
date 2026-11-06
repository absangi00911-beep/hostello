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
const MAX_AMENITY_FILTERS = 30;
const MAX_AMENITY_LENGTH = 100;
const MAX_SEARCH_LENGTH = 200;
const MAX_CITY_LENGTH = 100;

interface NearbySearchBody {
  latitude: number;
  longitude: number;
  moveInDate?: string;
  checkOut?: string;
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
      (key) =>       !["latitude", "longitude", "moveInDate", "checkOut", "guests"].includes(key),
    )
  ) {
    return false;
  }

  if ("moveInDate" in value && !isMoveInDate(value.moveInDate)) {
    return false;
  }
  if ("checkOut" in value && !isMoveInDate(value.checkOut)) {
    return false;
  }
  if (
    "checkOut" in value &&
    (!("moveInDate" in value) ||
      typeof value.checkOut !== "string" ||
      typeof value.moveInDate !== "string" ||
      value.checkOut <= value.moveInDate)
  ) {
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
    const queryValues = req.nextUrl.searchParams.getAll("q");
    const cityValues = req.nextUrl.searchParams.getAll("city");
    const verifiedValues = req.nextUrl.searchParams.getAll("verified");
    const q = queryValues[0];
    const city = cityValues[0];
    const verifiedValue = verifiedValues[0];
    const verified = verifiedValue === "true" ? true : undefined;
    const genderValues = req.nextUrl.searchParams.getAll("gender");
    const genderValue = genderValues[0];
    const gender =
      genderValue === "MALE" || genderValue === "FEMALE" || genderValue === "MIXED"
        ? genderValue
        : undefined;
    const minPriceValues = req.nextUrl.searchParams.getAll("minPrice");
    const maxPriceValues = req.nextUrl.searchParams.getAll("maxPrice");
    const minPrice = minPriceValues[0] === undefined
      ? undefined
      : Number(minPriceValues[0]);
    const maxPrice = maxPriceValues[0] === undefined
      ? undefined
      : Number(maxPriceValues[0]);
    const amenities = req.nextUrl.searchParams.getAll("amenities");
    const sortValues = req.nextUrl.searchParams.getAll("sort");
    const sortValue = sortValues[0];
    const sort =
      sortValue === "price_asc" ||
      sortValue === "price_desc" ||
      sortValue === "rating" ||
      sortValue === "newest"
        ? sortValue
        : "newest";
    if (
      queryValues.length > 1 ||
      (q !== undefined && q.length > MAX_SEARCH_LENGTH) ||
      cityValues.length > 1 ||
      (city !== undefined && city.length > MAX_CITY_LENGTH) ||
      verifiedValues.length > 1 ||
      (verifiedValue !== undefined && verifiedValue !== "true") ||
      genderValues.length > 1 ||
      (genderValue !== undefined && gender === undefined) ||
      minPriceValues.length > 1 ||
      maxPriceValues.length > 1 ||
      (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) ||
      amenities.length > MAX_AMENITY_FILTERS ||
      amenities.some((amenity) => amenity.length > MAX_AMENITY_LENGTH) ||
      sortValues.length > 1 ||
      (sortValue !== undefined && sort !== sortValue)
    ) {
      return NextResponse.json(
        { error: "One or more search filters are invalid." },
        { status: 400 },
      );
    }
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
          q,
          city,
          gender,
          verified,
          minPrice,
          maxPrice,
          amenities: amenities.length ? amenities : undefined,
          moveInDate,
          checkOut: body.data.checkOut
            ? new Date(`${body.data.checkOut}T00:00:00.000Z`)
            : undefined,
          guests: moveInDate ? body.data.guests ?? 1 : undefined,
          sort,
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
