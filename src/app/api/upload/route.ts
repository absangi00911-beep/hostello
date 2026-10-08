import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/upload/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_HOSTEL } from "@/config/constants";
import { rateLimit } from "@/lib/rate-limit";
import { hasVerificationFileSignature } from "@/lib/verification-storage";
import { readBoundedFormData } from "@/lib/bounded-json";
import { isBoundedRouteParam } from "@/lib/route-params";

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
const MAX_REQUEST_BYTES = Math.floor(4.4 * 1000 * 1000);

class UploadStorageNotConfiguredError extends Error {
  constructor() {
    super("Public image storage is not configured.");
    this.name = "UploadStorageNotConfiguredError";
  }
}

async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

  // Keep local UI flows usable without making a production upload appear successful.
  if (!accountId || !accessKey || !secretKey || !bucket) {
    if (process.env.NODE_ENV === "production") {
      throw new UploadStorageNotConfiguredError();
    }
    console.warn("[upload] R2 not configured — returning placeholder URL");
    return `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80`;
  }

  let publicBaseUrl: URL;
  try {
    if (!publicUrl) throw new Error("Missing public URL");
    publicBaseUrl = new URL(publicUrl);
  } catch {
    throw new UploadStorageNotConfiguredError();
  }
  if (
    publicBaseUrl.protocol !== "https:" ||
    publicBaseUrl.username ||
    publicBaseUrl.password ||
    publicBaseUrl.search ||
    publicBaseUrl.hash ||
    publicUrl?.includes("?") ||
    publicUrl?.includes("#")
  ) {
    throw new UploadStorageNotConfiguredError();
  }

  // Dynamic import so the SDK is only loaded when actually needed
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const key = `hostels/${Date.now()}-${randomBytes(8).toString("hex")}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 uploads per 10 minutes per user (not IP)
    const rl = await rateLimit(`upload:${session.user.id}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
    }

    const boundedForm = await readBoundedFormData(req, MAX_REQUEST_BYTES);
    if (!boundedForm.ok) {
      return NextResponse.json({ error: boundedForm.error }, { status: boundedForm.status });
    }
    const formData = boundedForm.data;
    const file = formData.get("file") as File | null;
    const rawHostelId = formData.get("hostelId");
    if (rawHostelId !== null && typeof rawHostelId !== "string") {
      return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
    }
    const hostelId = rawHostelId || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // If hostelId provided, verify ownership and check image count
    if (hostelId) {
      if (!isBoundedRouteParam(hostelId)) {
        return NextResponse.json({ error: "Invalid hostel." }, { status: 400 });
      }
      if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only owners can upload listing images." }, { status: 403 });
      }

      const hostel = await db.hostel.findFirst({
        where: session.user.role === "ADMIN"
          ? { id: hostelId }
          : { id: hostelId, ownerId: session.user.id },
        select: { ownerId: true, images: true },
      });

      if (!hostel) {
        return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
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
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasVerificationFileSignature(file.type, buffer)) {
      return NextResponse.json({ error: "Image content does not match its declared file type." }, { status: 400 });
    }
    const url = await uploadToR2(buffer, file.name, file.type);

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadStorageNotConfiguredError) {
      console.error("[POST /api/upload] Public image storage is not configured.");
      return NextResponse.json({ error: "Image storage is unavailable." }, { status: 503 });
    }
    console.error("[POST /api/upload]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}
