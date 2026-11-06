// Path: src/lib/hostel-search.ts

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/client";
import { searchHostels, type TypesenseSearchHit, type TypesenseSearchResult, type HostelDocument } from "@/lib/typesense";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";
import {
  distanceBetweenCoordinatesKm,
  NEARBY_SEARCH_RADIUS_KM,
  type NearbyCoordinates,
} from "@/lib/nearby-search";
import {
  getAvailableHostelIdsForStay,
  lockAvailabilityInventory,
} from "@/lib/room-availability-service";

export interface SearchParams {
  q?: string;
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
  moveInDate?: Date;
  checkOut?: Date;
  guests?: number;
  nearby?: NearbyCoordinates;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page: number;
  limit: number;
}

export type PublicSearchFilters = Pick<
  SearchParams,
  "q" | "city" | "gender" | "minPrice" | "maxPrice" | "amenities" | "verified" | "nearby"
>;

export interface SearchResult {
  hostelIds: string[];
  total: number;
  isSearchDegraded: boolean;
}

function buildWhereClause(params: SearchParams): Prisma.HostelWhereInput {
  const where: Prisma.HostelWhereInput = { status: "ACTIVE" };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
      { area: { contains: params.q, mode: "insensitive" } },
      { address: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.city) where.city = params.city;
  if (params.gender) where.gender = params.gender;
  if (params.verified) where.verified = true;
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.pricePerMonth = {};
    if (params.minPrice !== undefined) where.pricePerMonth.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.pricePerMonth.lte = params.maxPrice;
  }
  if (params.amenities && params.amenities.length > 0) {
    where.amenities = { hasEvery: params.amenities };
  }
  return where;
}

function buildOrderByClause(
  sort: SearchParams["sort"],
): Prisma.HostelOrderByWithRelationInput {
  if (sort === "price_asc") return { pricePerMonth: "asc" };
  if (sort === "price_desc") return { pricePerMonth: "desc" };
  if (sort === "rating") return { rating: "desc" };
  return { createdAt: "desc" };
}

function buildNearbyWhereClause(params: SearchParams): Prisma.HostelWhereInput {
  const where = buildWhereClause(params);
  const location = params.nearby;
  if (!location) return where;

  const angularRadius = NEARBY_SEARCH_RADIUS_KM / 6_371;
  const latitudeDelta = angularRadius * (180 / Math.PI);
  const minLatitude = Math.max(-90, location.latitude - latitudeDelta);
  const maxLatitude = Math.min(90, location.latitude + latitudeDelta);
  const longitudeRatio =
    Math.sin(angularRadius) / Math.cos(location.latitude * (Math.PI / 180));
  const longitudeDelta =
    Math.abs(longitudeRatio) >= 1
      ? 180
      : Math.asin(Math.abs(longitudeRatio)) * (180 / Math.PI);

  where.latitude = { gte: minLatitude, lte: maxLatitude };
  if (longitudeDelta < 180) {
    const minLongitude = location.longitude - longitudeDelta;
    const maxLongitude = location.longitude + longitudeDelta;
    let longitudeWhere: Prisma.HostelWhereInput;

    if (minLongitude < -180) {
      longitudeWhere = {
        OR: [
          { longitude: { gte: minLongitude + 360 } },
          { longitude: { lte: maxLongitude } },
        ],
      };
    } else if (maxLongitude > 180) {
      longitudeWhere = {
        OR: [
          { longitude: { gte: minLongitude } },
          { longitude: { lte: maxLongitude - 360 } },
        ],
      };
    } else {
      longitudeWhere = {
        longitude: { gte: minLongitude, lte: maxLongitude },
      };
    }

    where.AND = [longitudeWhere];
  }
  return where;
}

export function buildPublicSearchWhereClause(
  filters: PublicSearchFilters,
): Prisma.HostelWhereInput {
  const params = { ...filters, page: 1, limit: 1 } satisfies SearchParams;
  return filters.nearby
    ? buildNearbyWhereClause(params)
    : buildWhereClause(params);
}

function isWithinNearbyRadius(
  hostel: { latitude: number | null; longitude: number | null },
  location: NearbyCoordinates,
): boolean {
  return (
    hostel.latitude !== null &&
    hostel.longitude !== null &&
    distanceBetweenCoordinatesKm(location, {
      latitude: hostel.latitude,
      longitude: hostel.longitude,
    }) <= NEARBY_SEARCH_RADIUS_KM
  );
}

function paginateHostels(
  hostels: { id: string }[],
  page: number,
  limit: number,
): SearchResult {
  const start = (page - 1) * limit;
  return {
    hostelIds: hostels.slice(start, start + limit).map((hostel) => hostel.id),
    total: hostels.length,
    isSearchDegraded: false,
  };
}

function isAvailableOnMoveInDate(
  hostel: {
    capacity: number;
    bookings: { guests: number }[];
    blockedDates: { id: string }[];
  },
  guests: number,
): boolean {
  return (
    hostel.blockedDates.length === 0 &&
    hostel.capacity -
      hostel.bookings.reduce((occupied, booking) => occupied + booking.guests, 0) >=
      guests
  );
}

async function searchHostelsWithExactStay(params: SearchParams): Promise<SearchResult> {
  const where = params.nearby
    ? buildNearbyWhereClause(params)
    : buildWhereClause(params);
  const candidateHostels = await db.hostel.findMany({
    where,
    select: { id: true, latitude: true, longitude: true },
    orderBy: buildOrderByClause(params.sort),
  });
  const candidateIds = candidateHostels
    .filter((hostel) => !params.nearby || isWithinNearbyRadius(hostel, params.nearby))
    .map((hostel) => hostel.id);
  if (candidateIds.length === 0) return paginateHostels([], params.page, params.limit);

  return db.$transaction(async (tx) => {
    await lockAvailabilityInventory(tx, candidateIds);
    const currentHostels = await tx.hostel.findMany({
      where: {
        AND: [where, { id: { in: candidateIds } }],
      },
      select: { id: true, latitude: true, longitude: true },
      orderBy: buildOrderByClause(params.sort),
    });
    const currentCandidates = currentHostels.filter(
      (hostel) => !params.nearby || isWithinNearbyRadius(hostel, params.nearby),
    );
    const availableHostels = await getAvailableHostelIdsForStay(tx, {
      hostelIds: currentCandidates.map((hostel) => hostel.id),
      checkIn: params.moveInDate!,
      checkOut: params.checkOut!,
      guests: params.guests ?? 1,
    });
    return paginateHostels(
      currentCandidates.filter((hostel) => availableHostels.has(hostel.id)),
      params.page,
      params.limit,
    );
  }, { isolationLevel: "ReadCommitted" });
}

/**
 * Search for hostels using Typesense with automatic fallback to Prisma
 * if Typesense is unavailable.
 *
 * This shared function ensures consistent search logic across API routes and RSCs.
 * Any future improvements to search handling are automatically applied everywhere.
 */
export async function searchHostelsWithFallback(
  params: SearchParams,
  logContext?: OperationalLogContext,
): Promise<SearchResult> {
  const { q, city, gender, minPrice, maxPrice, amenities, verified, sort, page, limit } = params;

  if (params.moveInDate && params.checkOut) {
    return searchHostelsWithExactStay(params);
  }

  if (params.nearby) {
    const where = buildNearbyWhereClause(params);

    if (params.moveInDate) {
      const hostels = await db.hostel.findMany({
        where,
        select: {
          id: true,
          latitude: true,
          longitude: true,
          capacity: true,
          bookings: {
            where: {
              status: { in: ["PENDING", "CONFIRMED"] },
              checkIn: { lte: params.moveInDate },
              checkOut: { gt: params.moveInDate },
            },
            select: { guests: true },
          },
          blockedDates: {
            where: {
              startDate: { lte: params.moveInDate },
              endDate: { gte: params.moveInDate },
            },
            select: { id: true },
          },
        },
        orderBy: buildOrderByClause(sort),
      });
      const nearbyAvailableHostels = hostels.filter(
        (hostel) =>
          isWithinNearbyRadius(hostel, params.nearby!) &&
          isAvailableOnMoveInDate(hostel, params.guests ?? 1),
      );
      return paginateHostels(nearbyAvailableHostels, page, limit);
    }

    const hostels = await db.hostel.findMany({
      where,
      select: { id: true, latitude: true, longitude: true },
      orderBy: buildOrderByClause(sort),
    });
    return paginateHostels(
      hostels.filter((hostel) => isWithinNearbyRadius(hostel, params.nearby!)),
      page,
      limit,
    );
  }

  if (params.moveInDate) {
    const hostels = await db.hostel.findMany({
      where: buildWhereClause(params),
      select: {
        id: true,
        capacity: true,
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            checkIn: { lte: params.moveInDate },
            checkOut: { gt: params.moveInDate },
          },
          select: { guests: true },
        },
        blockedDates: {
          where: {
            startDate: { lte: params.moveInDate },
            endDate: { gte: params.moveInDate },
          },
          select: { id: true },
        },
      },
      orderBy: buildOrderByClause(sort),
    });
    return paginateHostels(
      hostels.filter((hostel) =>
        isAvailableOnMoveInDate(hostel, params.guests ?? 1),
      ),
      page,
      limit,
    );
  }

  let hostelIds: string[];
  let total: number;
  let isSearchDegraded = false;
  let degradationReason: "typesense_error" | "empty_index" | undefined;
  let providerError: ReturnType<typeof getSafeErrorSummary> | undefined;

  // Try Typesense first. An empty index is also degraded: seeded or newly
  // approved database rows must remain discoverable before the next sync.
  try {
    const searchResults: TypesenseSearchResult<HostelDocument> = await searchHostels(q || "", {
      city: city ? city : undefined,
      gender: gender ? gender : undefined,
      minPrice,
      maxPrice,
      amenities,
      verified: verified !== undefined ? verified : undefined,
      sort: sort || "newest",
      page,
      limit,
    });

    // Extract hostel IDs from search results — fully typed access
    hostelIds = searchResults.hits.map((hit: TypesenseSearchHit<HostelDocument>) => hit.document.id);
    total = searchResults.found;

    if (total > 0) {
      return {
        hostelIds,
        total,
        isSearchDegraded,
      };
    }
    degradationReason = "empty_index";
  } catch (searchErr) {
    providerError = getSafeErrorSummary(searchErr);
    degradationReason = "typesense_error";
    isSearchDegraded = true;
  }

  // Full Prisma fallback with complete filter support.
  const whereClause = buildWhereClause(params);

  const fallbackHostels = await db.hostel.findMany({
    where: whereClause,
    select: { id: true },
    orderBy: buildOrderByClause(sort),
    skip: (page - 1) * limit,
    take: limit,
  });

  hostelIds = fallbackHostels.map((h) => h.id);
  total = await db.hostel.count({ where: whereClause });
  isSearchDegraded = true;

  // An empty Typesense result can be a valid no-match query. Report that path
  // only when the database fallback finds rows that the index missed.
  if (degradationReason === "typesense_error" || total > 0) {
    logOperationalEvent("warn", "search.degraded", {
      degradation_reason: degradationReason ?? "empty_index",
      result_count: total,
      page,
      page_size: limit,
      ...(providerError ? {
        provider_error_name: providerError.name,
        ...(providerError.code ? { provider_error_code: providerError.code } : {}),
        ...(providerError.status ? { provider_http_status: providerError.status } : {}),
      } : {}),
    }, logContext);
  }

  return {
    hostelIds,
    total,
    isSearchDegraded,
  };
}
