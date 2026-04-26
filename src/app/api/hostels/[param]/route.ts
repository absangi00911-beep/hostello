import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(50).max(2000).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  address: z.string().min(10).optional(),
  pricePerMonth: z.number().min(1000).max(100000).optional(),
  rooms: z.number().int().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  minStay: z.number().int().min(1).optional(),
  maxStay: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW"]).optional(),
});

function getAllowedImageOrigins(): string[] {
  const origins: string[] = [];
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (r2PublicUrl) origins.push(r2PublicUrl.replace(/\/+$/, ""));
  if (process.env.NODE_ENV !== "production" || !r2PublicUrl) {
    origins.push("https://images.unsplash.com");
  }
  return origins;
}

function isImageUrlAllowed(url: string): boolean {
  const allowed = getAllowedImageOrigins();
  if (allowed.length === 0) {
    console.error("[security] Image allowlist is empty — blocking all URLs");
    return false;
  }
  return allowed.some((o) => url.startsWith(o));
}

// ── R2 cleanup ─────────────────────────────────────────────────────────────

/**
 * Deletes R2 objects for images that were removed from a listing.
 * Fire-and-forget — a failure here is logged but never surfaces to the user.
 * Non-R2 URLs (Unsplash, etc.) are silently skipped.
 */
async function purgeOrphanedImages(
  previousUrls: string[],
  updatedUrls: string[],
): Promise<void> {
  const removed = previousUrls.filter((url) => !updatedUrls.includes(url));
  if (removed.length === 0) return;

  const publicUrl = process.env.R2_PUBLIC_URL;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!publicUrl || !accountId || !accessKey || !secretKey || !bucket) return;

  const base = publicUrl.replace(/\/+$/, "");
  const r2Keys = removed
    .filter((url) => url.startsWith(base))
    .map((url) => url.slice(base.length + 1));

  if (r2Keys.length === 0) return;

  try {
    const { S3Client, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: r2Keys.map((Key) => ({ Key })) },
      }),
    );
  } catch (err) {
    // Non-critical — orphaned objects are a storage cost concern, not a
    // data-integrity concern. Log and continue.
    console.error("[R2] Failed to delete orphaned images:", err);
  }
}

// ── Route handlers ─────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> },
) {
  try {
    const { param } = await params;

    const hostel = await db.hostel.findUnique({
      where: { slug: param },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            createdAt: true,
            _count: { select: { hostels: true } },
            // SECURITY: Never include phone in public API responses
            // Phone is only exposed through server-side gating after booking verification
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        rooms_rel: { orderBy: { pricePerMonth: "asc" } },
        _count: { select: { favorites: true } },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    db.hostel
      .update({ where: { id: hostel.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return NextResponse.json({ data: hostel });
  } catch (err) {
    console.error("[GET /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { param } = await params;

    const hostel = await db.hostel.findUnique({
      where: { id: param },
      select: { ownerId: true, images: true, status: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (hostel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't own this hostel." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.images) {
      for (const imageUrl of data.images) {
        if (!isImageUrlAllowed(imageUrl)) {
          return NextResponse.json(
            { error: "Image URLs must be from the authorised image storage." },
            { status: 400 },
          );
        }
      }
    }
    if (data.coverImage && !isImageUrlAllowed(data.coverImage)) {
      return NextResponse.json(
        { error: "Cover image URL must be from the authorised image storage." },
        { status: 400 },
      );
    }

    if (data.status === "PENDING_REVIEW") {
      const effectiveImages = data.images ?? (hostel.images as string[]);
      if (effectiveImages.length === 0) {
        return NextResponse.json(
          { error: "Add at least one photo before submitting for review." },
          { status: 400 },
        );
      }
    }

    const updated = await db.hostel.update({
      where: { id: param },
      data,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        images: true,
        coverImage: true,
      },
    });

    // Sync to Typesense if hostel is ACTIVE
    // Fire-and-forget to not block response
    const hostelFull = await db.hostel.findUnique({
      where: { id: param },
      select: { status: true },
    });
    if (hostelFull?.status === "ACTIVE") {
      void indexSingleHostel(param).catch((err) =>
        console.error(`[typesense] Failed to sync hostel ${param}:`, err)
      );
    }

    // Purge images removed from the listing.
    // Fire-and-forget — the DB is already consistent; R2 cleanup is best-effort.
    if (data.images) {
      void purgeOrphanedImages(hostel.images as string[], data.images);
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ param: string }> },
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
      return NextResponse.json(
        { error: "You don't own this hostel." },
        { status: 403 },
      );
    }

    await db.$transaction([
      db.hostel.update({
        where: { id: param },
        data: { status: "SUSPENDED" },
      }),
      db.booking.updateMany({
        where: {
          hostelId: param,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        data: { status: "CANCELLED" },
      }),
    ]);

    // Remove from Typesense index
    void removeHostelIndex(param).catch((err) =>
      console.error(`[typesense] Failed to remove hostel ${param}:`, err)
    );

    return NextResponse.json({ message: "Hostel removed from listings." });
  } catch (err) {
    console.error("[DELETE /api/hostels/[param]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}