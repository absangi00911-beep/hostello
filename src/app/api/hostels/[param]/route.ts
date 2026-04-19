import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name:          z.string().min(3).max(100).optional(),
  description:   z.string().min(50).max(2000).optional(),
  city:          z.string().optional(),
  area:          z.string().optional(),
  address:       z.string().min(10).optional(),
  pricePerMonth: z.number().min(1000).max(100000).optional(),
  rooms:         z.number().int().min(1).optional(),
  capacity:      z.number().int().min(1).optional(),
  gender:        z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  minStay:       z.number().int().min(1).optional(),
  maxStay:       z.number().int().optional(),
  amenities:     z.array(z.string()).optional(),
  rules:         z.array(z.string()).optional(),
  images:        z.array(z.string().url()).optional(),
  coverImage:    z.string().url().optional(),
  status:        z.enum(["DRAFT", "PENDING_REVIEW"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const { param } = await params;

    const hostel = await db.hostel.findUnique({
      where: { slug: param },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, phone: true, createdAt: true },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        rooms_rel: {
          orderBy: { pricePerMonth: "asc" },
        },
        _count: {
          select: { favorites: true },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    // Fire-and-forget view count increment
    db.hostel
      .update({
        where: { id: hostel.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json({ data: hostel });
  } catch (err) {
    console.error("[GET /api/hostels/[param]]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { param } = await params;

    // Confirm the hostel belongs to this owner (or user is admin)
    const hostel = await db.hostel.findUnique({
      where: { id: param },
      select: { ownerId: true, images: true, status: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (hostel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "You don't own this hostel." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate image URLs to ensure they come from our R2 bucket (prevent arbitrary external URLs)
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    if (data.images && R2_PUBLIC_URL) {
      for (const imageUrl of data.images) {
        if (!imageUrl.startsWith(R2_PUBLIC_URL)) {
          return NextResponse.json(
            { error: "Image URLs must be from the authorized image storage." },
            { status: 400 }
          );
        }
      }
    }
    if (data.coverImage && R2_PUBLIC_URL) {
      if (!data.coverImage.startsWith(R2_PUBLIC_URL)) {
        return NextResponse.json(
          { error: "Cover image URL must be from the authorized image storage." },
          { status: 400 }
        );
      }
    }

    if (data.status === "PENDING_REVIEW") {
      const updatedImages = data.images ?? hostel.images;
      if (updatedImages.length === 0) {
        return NextResponse.json(
          { error: "Add at least one photo before submitting for review." },
          { status: 400 }
        );
      }
    }

    const updated = await db.hostel.update({
      where: { id: param },
      data,
      select: {
        id: true, slug: true, name: true, status: true,
        images: true, coverImage: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { param } = await params;

    const hostel = await db.hostel.findUnique({
      where: { id: param },
      select: { ownerId: true, status: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (hostel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "You don't own this hostel." }, { status: 403 });
    }

    // Use a transaction to atomically suspend hostel and cancel active bookings
    await db.$transaction([
      db.hostel.update({
        where: { id: param },
        data: { status: "SUSPENDED" },
      }),
      db.booking.updateMany({
        where: { 
          hostelId: param, 
          status: { in: ["PENDING", "CONFIRMED"] } 
        },
        data: { status: "CANCELLED" },
      }),
    ]);

    return NextResponse.json({ message: "Hostel removed from listings." });
  } catch (err) {
    console.error("[DELETE /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
