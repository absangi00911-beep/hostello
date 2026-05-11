import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { searchParamsSchema, hostelCreateSchema } from "@/lib/validations";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { createHostelRecord } from "@/lib/hostel-service";
import { searchHostelsWithFallback } from "@/lib/hostel-search";

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

    // Use shared search service with Typesense → Prisma fallback
    const searchResult = await searchHostelsWithFallback({
      q,
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

    const hostelIds = searchResult.hostelIds;
    const total = searchResult.total;
    const isSearchDegraded = searchResult.isSearchDegraded;

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
      .filter((h): h is Exclude<typeof h, undefined> => h !== undefined);

    return NextResponse.json({
      data: orderedHostels,
      total,
      page,
      limit,
      hasMore: (page - 1) * limit + orderedHostels.length < total,
      isSearchDegraded,
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

    // 10 listings per user per hour
    const rl = await rateLimit(`hostel-create:${session.user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const body = await req.json();
    const parsed = hostelCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!session.user.email) {
      return NextResponse.json(
        { error: "Account email is missing. Please update your profile." },
        { status: 400 }
      );
    }

    const hostel = await createHostelRecord(
      session.user.id,
      session.user.name && session.user.name.trim() !== "" ? session.user.name : "Owner",
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
