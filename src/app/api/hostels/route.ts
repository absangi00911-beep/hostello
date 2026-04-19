import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchParamsSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());

    // Parse amenities as array
    const amenitiesRaw = url.searchParams.getAll("amenities");
    if (amenitiesRaw.length > 0) {
      raw.amenities = amenitiesRaw as unknown as string;
    }

    const parsed = searchParamsSchema.safeParse({
      ...raw,
      amenities: amenitiesRaw.length > 0 ? amenitiesRaw : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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
    } = parsed.data;

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
      ...(amenities?.length && {
        amenities: { hasEvery: amenities },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { area: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
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
          featured: true,
          rating: true,
          reviewCount: true,
          capacity: true,
          rooms: true,
          owner: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.hostel.count({ where }),
    ]);

    return NextResponse.json({
      data: hostels,
      total,
      page,
      limit,
      hasMore: skip + hostels.length < total,
    });
  } catch (err) {
    console.error("[GET /api/hostels]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
