// Path: src/lib/hostel-search.ts

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/client";
import { searchHostels, type TypesenseSearchHit, type TypesenseSearchResult, type HostelDocument } from "@/lib/typesense";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

export interface SearchParams {
  q?: string;
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page: number;
  limit: number;
}

export interface SearchResult {
  hostelIds: string[];
  total: number;
  isSearchDegraded: boolean;
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
  const whereClause: Prisma.HostelWhereInput = { status: "ACTIVE" };
  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { area: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }
  if (city) whereClause.city = city;
  if (gender) whereClause.gender = gender;
  if (verified) whereClause.verified = true;
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.pricePerMonth = {};
    if (minPrice !== undefined) whereClause.pricePerMonth.gte = minPrice;
    if (maxPrice !== undefined) whereClause.pricePerMonth.lte = maxPrice;
  }
  if (amenities && amenities.length > 0) {
    // Match hostels that have ALL specified amenities (consistent with Typesense)
    whereClause.amenities = { hasEvery: amenities };
  }

  const orderByClause: Prisma.HostelOrderByWithRelationInput = {};
  if (sort === "price_asc") orderByClause.pricePerMonth = "asc";
  else if (sort === "price_desc") orderByClause.pricePerMonth = "desc";
  else if (sort === "rating") orderByClause.rating = "desc";
  else orderByClause.createdAt = "desc";

  const fallbackHostels = await db.hostel.findMany({
    where: whereClause,
    select: { id: true },
    orderBy: Object.keys(orderByClause).length > 0 ? orderByClause : { createdAt: "desc" },
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
