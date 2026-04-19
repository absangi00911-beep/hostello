import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { hostelCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

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
        // Images come from the upload step — not validated by hostelCreateSchema
        images: Array.isArray(body.images) ? body.images : [],
        coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
        // Hostels must be reviewed by admin before going live
        status: "PENDING_REVIEW",
        ownerId: session.user.id,
      },
      select: { id: true, slug: true, name: true, status: true },
    });

    return NextResponse.json(
      { data: hostel, message: "Hostel created as draft. Add photos to publish." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
