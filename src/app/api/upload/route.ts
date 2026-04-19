import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_HOSTEL } from "@/config/constants";

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - hostelId: (optional) to attach the image to a hostel after upload
 *
 * Returns: { url: string }
 *
 * Storage: Cloudflare R2 via the AWS S3-compatible SDK.
 * In development without R2 credentials the upload is skipped and a
 * placeholder URL is returned so the rest of the flow works locally.
 */

const MAX_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  // Dev mode — no R2 configured, return a placeholder
  if (!accountId || !accessKey || !secretKey || !bucket) {
    console.warn("[upload] R2 not configured — returning placeholder URL");
    return `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80`;
  }

  // Dynamic import so the SDK is only loaded when actually needed
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const key = `hostels/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl}/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const hostelId = formData.get("hostelId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // If hostelId provided, verify ownership and check image count
    if (hostelId) {
      const hostel = await db.hostel.findUnique({
        where: { id: hostelId },
        select: { ownerId: true, images: true },
      });

      if (!hostel) {
        return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
      }

      if (hostel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "You don't own this hostel." }, { status: 403 });
      }

      // Check server-side image count limit
      if (hostel.images.length >= MAX_IMAGES_PER_HOSTEL) {
        return NextResponse.json(
          { error: `Maximum ${MAX_IMAGES_PER_HOSTEL} images allowed per hostel.` },
          { status: 400 }
        );
      }
    }

    // Type validation
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      );
    }

    // Size validation
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, file.name, file.type);

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}
