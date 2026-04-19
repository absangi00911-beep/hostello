import { db } from "@/lib/db";
import { searchParamsSchema } from "@/lib/validations";
import { HostelCard } from "@/components/features/hostels/hostel-card";
import type { Prisma } from "@prisma/client";
import { SearchPagination } from "./search-pagination";
import { Frown } from "lucide-react";
import Link from "next/link";

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

  const where: Prisma.HostelWhereInput = {
    status: "ACTIVE",
    ...(city && { city: { equals: city, mode: "insensitive" } }),
    ...(gender && { gender }),
    ...(verified !== undefined && { verified }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          pricePerMonth: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),
    ...(amenities?.length && { amenities: { hasSome: amenities } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { area: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.HostelOrderByWithRelationInput =
    sort === "price_asc"
      ? { pricePerMonth: "asc" }
      : sort === "price_desc"
      ? { pricePerMonth: "desc" }
      : sort === "rating"
      ? { rating: "desc" }
      : { createdAt: "desc" };

  const skip = (page - 1) * limit;

  const [hostels, total] = await Promise.all([
    db.hostel.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        capacity: true,
        rooms: true,
        owner: { select: { id: true, name: true, avatar: true } },
      },
    }),
    db.hostel.count({ where }),
  ]);

  if (hostels.length === 0) {
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
        {hostels.map((hostel) => (
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
}
