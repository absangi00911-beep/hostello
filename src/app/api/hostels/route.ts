// Path: src/app/api/hostels/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { hostelCreateSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { createHostelRecord } from "@/lib/hostel-service";
import { PLANS } from "@/config/plans";

// This file was missing entirely — SearchPageClient.tsx has always called
// fetch(`/api/hostels?...`), but nothing implemented that endpoint. The
// actual search/filter/sort logic already existed and was tested in
// src/lib/hostel-search.ts (searchHostelsWithFallback); this route's job
// is just to call it and shape the response the client expects.

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can create listings." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = hostelCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const owner = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, plan: true },
    });
    if (!owner) return NextResponse.json({ error: "Owner not found." }, { status: 404 });

    const listingCount = await db.hostel.count({ where: { ownerId: session.user.id } });
    if (listingCount >= PLANS[owner.plan].maxListings) {
      return NextResponse.json(
        { error: "You've reached your listing limit.", code: "QUOTA_EXCEEDED" },
        { status: 403 },
      );
    }

    const hostel = await createHostelRecord(
      session.user.id,
      owner.name,
      owner.email,
      parsed.data,
      body,
    );

    return NextResponse.json({ data: hostel, message: "Listing submitted for review." }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    const q      = params.get("q") ?? undefined;
    const city   = params.get("city") ?? undefined;
    const genderParam = params.get("gender");
    const gender = genderParam === "MALE" || genderParam === "FEMALE" || genderParam === "MIXED" ? genderParam : undefined;
    const minPrice = params.has("minPrice") ? Number(params.get("minPrice")) : undefined;
    const maxPrice = params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined;
    const amenities = params.getAll("amenities");
    const sortParam = params.get("sort");
    const sort = (["price_asc", "price_desc", "rating", "newest"] as const).includes(sortParam as any)
      ? (sortParam as "price_asc" | "price_desc" | "rating" | "newest")
      : "newest";
    const page  = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

    const { hostelIds, total, isSearchDegraded } = await searchHostelsWithFallback({
      q,
      city,
      gender,
      minPrice,
      maxPrice,
      amenities: amenities.length ? amenities : undefined,
      sort,
      page,
      limit,
    });

    // Fetch full records for the matched IDs. findMany with `id: { in }`
    // does NOT preserve input order, so the search's relevance/sort order
    // has to be re-applied after the fetch.
    const hostels = hostelIds.length
      ? await db.hostel.findMany({
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
            featured: true,
            rating: true,
            reviewCount: true,
            safetyScore: true,
            capacity: true,
            rooms: true,
            latitude: true,
            longitude: true,
            owner: {
              select: { id: true, name: true, avatar: true },
            },
          },
        })
      : [];

    const byId = new Map(hostels.map((h) => [h.id, h]));
    const orderedHostels = hostelIds
      .map((id) => byId.get(id))
      .filter((h): h is NonNullable<typeof h> => h !== undefined);

    return NextResponse.json({
      data: orderedHostels,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      isSearchDegraded,
    });
  } catch (err) {
    console.error("[GET /api/hostels]", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}