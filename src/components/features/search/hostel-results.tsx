import { db } from "@/lib/db";
import { searchParamsSchema } from "@/lib/validations";
import { HostelCard } from "@/components/features/hostels/hostel-card";
import { SearchPagination } from "./search-pagination";
import { Frown } from "lucide-react";
import Link from "next/link";
import { searchHostels } from "@/lib/typesense";

interface HostelResultsProps {
  params: Record<string, string | string[]>;
}

function normalizeParams(params: Record<string, string | string[]>) {
  const amenitiesRaw = params.amenities;
  const amenities = amenitiesRaw
    ? Array.isArray(amenitiesRaw)
      ? amenitiesRaw
      : [amenitiesRaw]
    : undefined;

  return searchParamsSchema.parse({
    q: params.q,
    city: params.city,
    gender: params.gender,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    amenities,
    verified: params.verified,
    sort: params.sort,
    page: params.page,
    limit: params.limit,
  });
}

export async function HostelResults({ params }: HostelResultsProps) {
  try {
    const {
      q,
      city,
      gender,
      minPrice,
      maxPrice,
      amenities,
      verified,
      sort,
      page,
      limit,
    } = normalizeParams(params);

    let hostelIds: string[];
    let total: number;

    // Try Typesense first, fall back to Prisma if unavailable
    try {
      const searchResults = await searchHostels(q || "", {
        city: city ? city : undefined,
        gender: gender ? gender : undefined,
        minPrice,
        maxPrice,
        amenities,
        verified: verified !== undefined ? verified : undefined,
        sort: (sort as "price_asc" | "price_desc" | "rating" | "newest") || "newest",
        page,
        limit,
      });

      // Extract hostel IDs from search results
      hostelIds = (searchResults.hits || []).map((hit: any) => hit.document.id);
      total = (searchResults as any).found || 0;
    } catch (searchErr) {
      console.error("[search] Typesense failed, falling back to Prisma", searchErr);

      // Basic Prisma fallback
      const whereClause: any = { status: "ACTIVE" };
      if (city) whereClause.city = city;
      if (gender) whereClause.gender = gender;
      if (verified) whereClause.verified = true;

      const fallbackHostels = await db.hostel.findMany({
        where: whereClause,
        select: { id: true },
        skip: (page - 1) * limit,
        take: limit,
      });

      hostelIds = fallbackHostels.map((h) => h.id);

      // Get total count for pagination
      total = await db.hostel.count({ where: whereClause });
    }

    // Fetch full hostel details from database
    const hostels = await db.hostel.findMany({
      where: { id: { in: hostelIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        area: true,
        pricePerMonth: true,
        gender: true,
        amenities: true,
        coverImage: true,
        images: true,
        verified: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        capacity: true,
        rooms: true,
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Maintain search result order from Typesense
    const hostelMap = new Map(hostels.map((h) => [h.id, h]));
    const orderedHostels = hostelIds
      .map((id: string) => hostelMap.get(id))
      .filter((h: any) => h !== undefined);

    if (orderedHostels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Frown className="w-7 h-7 text-[var(--color-muted)]" />
          <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
            No hostels found
          </h3>
          <p className="text-sm text-[var(--color-muted)] max-w-xs">
            Try adjusting your filters or searching a different city.
          </p>
          <Link
            href="/hostels"
            className="mt-6 text-sm font-bold text-[var(--color-brand-700)] hover:underline"
          >
            Clear all filters
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Result count */}
        <p className="text-sm text-[var(--color-muted)]">
          {total.toLocaleString()} hostel{total !== 1 ? "s" : ""} found
          {page > 1 && ` · Page ${page}`}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {orderedHostels.map((hostel: any) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>

        {/* Pagination */}
        {total > limit && (
          <SearchPagination
            page={page}
            total={total}
            limit={limit}
            params={params}
          />
        )}
      </div>
    );
  } catch (err) {
    console.error("[HostelResults] Fatal error:", err);
    
    // Show error state to user instead of throwing
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Frown className="w-7 h-7 text-red-500" />
        <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Something went wrong
        </h3>
        <p className="text-sm text-[var(--color-muted)] max-w-xs">
          We encountered an error while loading hostels. Please try again.
        </p>
        <Link
          href="/hostels"
          className="mt-6 text-sm font-bold text-[var(--color-brand-700)] hover:underline"
        >
          Refresh page
        </Link>
      </div>
    );
  }
}
