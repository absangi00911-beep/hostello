// Path: src/lib/legacy-verification-docs.ts
import { db } from "@/lib/db";

// Before the private verification bucket existed, student documents were uploaded to the
// PUBLIC image bucket under hostels/ and stored as a public URL. Anyone with that URL can
// still fetch the file, so it must be deleted when it is no longer needed (decision made,
// account deleted), not just forgotten in the database.

const LEGACY_PATH = /^\/hostels\/([A-Za-z0-9._-]+)$/;

/** The public-bucket key ("hostels/<name>") when `value` is a legacy public document URL. */
export function getLegacyPublicDocumentKey(value: string | null | undefined): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();
  if (!value || !publicUrl) return null;
  try {
    const candidate = new URL(value);
    const base = new URL(publicUrl);
    if (candidate.protocol !== "https:" || candidate.origin !== base.origin) return null;
    if (candidate.search || candidate.hash) return null;
    const name = LEGACY_PATH.exec(candidate.pathname)?.[1];
    return name ? `hostels/${name}` : null;
  } catch {
    return null;
  }
}

export function isLegacyPublicDocumentUrl(value: string | null | undefined): boolean {
  return getLegacyPublicDocumentKey(value) !== null;
}

/**
 * Delete a legacy verification document from the public bucket.
 * Returns true when the delete was issued (the object is gone afterwards, also if it was
 * already missing) and false when it was deliberately skipped because the same file is in
 * use as a listing photo. Throws when storage is unavailable, so callers can retry.
 */
export async function deleteLegacyPublicVerificationDocument(url: string): Promise<boolean> {
  const key = getLegacyPublicDocumentKey(url);
  if (!key) throw new Error("Not a legacy public verification document URL.");

  const stillUsedByListing = await db.hostel.count({
    where: { OR: [{ coverImage: url }, { images: { has: url } }] },
  });
  if (stillUsedByListing > 0) return false;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Public image storage is not configured.");
  }

  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}
