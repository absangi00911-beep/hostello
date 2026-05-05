import { db } from "@/lib/db";
import { searchHostels, type TypesenseSearchHit, type TypesenseSearchResult, type HostelDocument } from "@/lib/typesense";

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
export async function searchHostelsWithFallback(params: SearchParams): Promise<SearchResult> {
  const { q, city, gender, minPrice, maxPrice, amenities, verified, sort, page, limit } = params;

  let hostelIds: string[];
  let total: number;
  let isSearchDegraded = false;

  // Try Typesense first, fall back to Prisma if unavailable
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
  } catch (searchErr) {
    console.error("[searchHostelsWithFallback] Typesense failed, falling back to Prisma", searchErr);
    isSearchDegraded = true;

    // Full Prisma fallback with complete filter support
    const whereClause: any = { status: "ACTIVE" };
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

    // Determine sort order
    const orderByClause: any = {};
    if (sort === "price_asc") orderByClause.pricePerMonth = "asc";
    else if (sort === "price_desc") orderByClause.pricePerMonth = "desc";
    else if (sort === "rating") orderByClause.rating = "desc";
    else orderByClause.createdAt = "desc"; // newest

    const fallbackHostels = await db.hostel.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: Object.keys(orderByClause).length > 0 ? orderByClause : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    hostelIds = fallbackHostels.map((h) => h.id);

    // Get total count for pagination
    total = await db.hostel.count({ where: whereClause });
  }

  return {
    hostelIds,
    total,
    isSearchDegraded,
  };
}
