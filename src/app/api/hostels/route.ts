import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { searchParamsSchema, hostelCreateSchema } from "@/lib/validations";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { newListingAdminEmail } from "@/lib/email-templates/new-listing";
import type { Prisma } from "@prisma/client";

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
        amenities: { hasSome: amenities },
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

    // Generate a unique slug
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let attempt = 0;

    while (await db.hostel.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const hostel = await db.hostel.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        city: data.city,
        area: data.area ?? null,
        address: data.address,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        pricePerMonth: data.pricePerMonth,
        rooms: data.rooms,
        capacity: data.capacity,
        gender: data.gender,
        minStay: data.minStay,
        maxStay: data.maxStay ?? null,
        amenities: data.amenities,
        rules: data.rules ?? [],
        images: Array.isArray(body.images) ? body.images : [],
        coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
        status: "PENDING_REVIEW",
        ownerId: session.user.id,
      },
      select: { id: true, slug: true, name: true, status: true, city: true, pricePerMonth: true },
    });

    // Notify admin — fire and forget, never blocks the response
    void sendEmail(
      newListingAdminEmail({
        ownerName: session.user.name,
        ownerEmail: session.user.email,
        hostelName: hostel.name,
        hostelId: hostel.id,
        city: hostel.city,
        pricePerMonth: hostel.pricePerMonth,
      })
    ).catch((err) => console.error("[create-hostel] Admin notification failed:", err));

    return NextResponse.json(
      { data: hostel, message: "Hostel submitted for review. We'll notify you once it's approved." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
