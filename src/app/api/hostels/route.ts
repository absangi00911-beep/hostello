import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { searchParamsSchema, hostelCreateSchema } from "@/lib/validations";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { createHostelRecord } from "@/lib/hostel-service";
import { searchHostels } from "@/lib/typesense";

export async function GET(req: NextRequest) {
  // 60 search requests per IP per minute
  const rl = await rateLimit(`search:${getIp(req)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

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

    // Search using Typesense
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
    const hostelIds = (searchResults.hits || []).map((hit: any) => hit.document.id);

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
        featured: true,
        rating: true,
        reviewCount: true,
        capacity: true,
        rooms: true,
        owner: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Maintain search result order from Typesense
    const hostelMap = new Map(hostels.map((h) => [h.id, h]));
    const orderedHostels = hostelIds
      .map((id: string) => hostelMap.get(id))
      .filter((h: any) => h !== undefined);

    const total = (searchResults as any).found || 0;

    return NextResponse.json({
      data: orderedHostels,
      total,
      page,
      limit,
      hasMore: (page - 1) * limit + orderedHostels.length < total,
    });
  } catch (err) {
    console.error("[GET /api/hostels]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Sign in to list a hostel." }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners can list hostels." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = hostelCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const hostel = await createHostelRecord(
      session.user.id,
      session.user.name,
      session.user.email,
      data,
      body
    );

    return NextResponse.json(
      { data: hostel, message: "Hostel submitted for review. We'll notify you once it's approved." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
