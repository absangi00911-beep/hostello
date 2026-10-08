import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";

export const MAX_VERIFICATION_FILE_BYTES = 4 * 1024 * 1024;
export const VERIFICATION_UPLOAD_RETENTION_MS = 60 * 60 * 1000;

export const VERIFICATION_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

type VerificationContentType = (typeof VERIFICATION_CONTENT_TYPES)[number];

function getBucketName(): string {
  const bucket = process.env.R2_VERIFICATION_BUCKET_NAME?.trim();
  if (!bucket) throw new Error("Private verification storage is not configured.");
  return bucket;
}

let client: S3Client | undefined;

function getClient(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_VERIFICATION_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_VERIFICATION_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Private verification storage credentials are not configured.");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function isVerificationObjectKey(key: string, userId: string): boolean {
  const prefix = `student-verifications/${userId}/`;
  return key.startsWith(prefix) && /^[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(key.slice(prefix.length));
}

export function isVerificationUploadKey(key: string, userId: string): boolean {
  const prefix = `student-verification-uploads/${userId}/`;
  return key.startsWith(prefix) && /^[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(key.slice(prefix.length));
}

function extensionForContentType(contentType: VerificationContentType): string {
  switch (contentType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "application/pdf": return "pdf";
  }
}

export function isVerificationContentType(value: string | undefined): value is VerificationContentType {
  return VERIFICATION_CONTENT_TYPES.includes(value as VerificationContentType);
}

export function verificationContentTypeForKey(key: string): VerificationContentType | null {
  if (key.endsWith(".jpg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".pdf")) return "application/pdf";
  return null;
}

export async function storeVerificationUpload(
  userId: string,
  contentType: VerificationContentType,
  bytes: Uint8Array,
): Promise<string> {
  if (
    bytes.byteLength <= 0 ||
    bytes.byteLength > MAX_VERIFICATION_FILE_BYTES ||
    !hasVerificationFileSignature(contentType, bytes)
  ) {
    throw new Error("Verification document is invalid.");
  }

  const key = `student-verification-uploads/${userId}/${randomBytes(16).toString("hex")}.${extensionForContentType(contentType)}`;
  await getClient().send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: bytes,
    ContentLength: bytes.byteLength,
    ContentType: contentType,
    CacheControl: "private, no-store",
  }));
  return key;
}

export async function promoteVerificationUpload(
  uploadKey: string,
  userId: string,
  contentType: VerificationContentType,
): Promise<string> {
  const bucket = getBucketName();
  const objectKey = `student-verifications/${userId}/${randomBytes(16).toString("hex")}.${extensionForContentType(contentType)}`;
  const encodedUploadKey = uploadKey.split("/").map(encodeURIComponent).join("/");

  await getClient().send(new CopyObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    CopySource: `${bucket}/${encodedUploadKey}`,
    MetadataDirective: "REPLACE",
    ContentType: contentType,
    CacheControl: "private, no-store",
  }));

  await deleteVerificationDocument(uploadKey).catch(() => undefined);
  return objectKey;
}

export async function verifyUploadedDocument(key: string) {
  const bucket = getBucketName();
  const s3 = getClient();
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const contentType = head.ContentType;
  if (
    !isVerificationContentType(contentType) ||
    typeof head.ContentLength !== "number" ||
    head.ContentLength <= 0 ||
    head.ContentLength > MAX_VERIFICATION_FILE_BYTES
  ) {
    await deleteVerificationDocument(key).catch(() => undefined);
    throw new Error("Verification document metadata is invalid.");
  }

  const prefix = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    Range: "bytes=0-15",
  }));
  if (!prefix.Body) {
    await deleteVerificationDocument(key).catch(() => undefined);
    throw new Error("Verification document is unreadable.");
  }
  const bytes = await prefix.Body.transformToByteArray();
  if (!hasVerificationFileSignature(contentType, bytes)) {
    await deleteVerificationDocument(key).catch(() => undefined);
    throw new Error("Verification document content does not match its declared type.");
  }

  return { contentType, contentLength: head.ContentLength };
}

export function hasVerificationFileSignature(contentType: string, bytes: Uint8Array): boolean {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") {
    return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  }
  if (contentType === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  if (contentType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  return false;
}

export async function getVerificationDocument(key: string) {
  return getClient().send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
}

export async function deleteVerificationDocument(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));
}

export function findExpiredVerificationUploadKeys(
  objects: Array<{ Key?: string; LastModified?: Date }>,
  nowMs = Date.now(),
): string[] {
  const cutoff = nowMs - VERIFICATION_UPLOAD_RETENTION_MS;
  return objects.flatMap(({ Key, LastModified }) => {
    if (
      Key?.startsWith("student-verification-uploads/") &&
      /\/[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(Key) &&
      LastModified instanceof Date && LastModified.getTime() <= cutoff
    ) {
      return [Key];
    }
    return [];
  });
}

export async function deleteExpiredVerificationUploads(): Promise<number> {
  const bucket = getBucketName();
  const s3 = getClient();
  const listed = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: "student-verification-uploads/",
    MaxKeys: 1000,
  }));
  const keys = findExpiredVerificationUploadKeys(listed.Contents ?? []);
  if (keys.length === 0) return 0;

  const deleted = await s3.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
  }));
  if (deleted.Errors?.length) throw new Error("Some expired verification uploads could not be deleted.");
  return keys.length;
}
