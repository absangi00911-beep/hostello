import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";

const JPEG_BYTES = Buffer.from(
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJAB58//2Q==",
  "base64",
);

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  hostelFindFirst: vi.fn(),
  r2Send: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: { hostel: { findFirst: mocks.hostelFindFirst } },
}));
vi.mock("@/lib/verification-storage", () => ({
  hasVerificationFileSignature: (contentType: string, bytes: Uint8Array) =>
    contentType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8,
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send(command: { input: Record<string, unknown> }) {
      return mocks.r2Send(command);
    }
  },
  PutObjectCommand: class {
    input: Record<string, unknown>;

    constructor(input: Record<string, unknown>) {
      this.input = input;
    }
  },
}));

import { POST } from "./route";

function request(hostelId?: string | Blob, fileBytes: Uint8Array = JPEG_BYTES) {
  const formData = new FormData();
  formData.append("file", new Blob([Uint8Array.from(fileBytes)], { type: "image/jpeg" }), "room.jpg");
  if (hostelId !== undefined) {
    if (typeof hostelId === "string") {
      formData.append("hostelId", hostelId);
    } else {
      formData.append("hostelId", hostelId, "hostel-id.txt");
    }
  }
  return new NextRequest("https://hostello.test/api/upload", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/upload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 600_000 });
    mocks.r2Send.mockResolvedValue({});
  });

  it("uploads re-encoded image bytes with source metadata removed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "https://images.example.com");
    const original = await sharp({
      create: {
        width: 2,
        height: 3,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .withMetadata({
        orientation: 6,
        exif: { IFD0: { Artist: "private-owner-data" } },
      })
      .toBuffer();

    const response = await POST(request(undefined, original));
    const body = await response.json();
    const upload = mocks.r2Send.mock.calls[0][0] as {
      input: { Body: Buffer; ContentType: string };
    };
    const storedMetadata = await sharp(upload.input.Body).metadata();

    expect(response.status).toBe(201);
    expect(body.url).toMatch(/^https:\/\/images\.example\.com\/hostels\//);
    expect(upload.input.Body).not.toEqual(original);
    expect(upload.input.ContentType).toBe("image/jpeg");
    expect(storedMetadata.format).toBe("jpeg");
    expect(storedMetadata.orientation).toBeUndefined();
    expect(storedMetadata.exif).toBeUndefined();
    expect([storedMetadata.width, storedMetadata.height]).toEqual([3, 2]);
  });

  it("rejects a truncated image before sending it to public storage", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "https://images.example.com");

    const response = await POST(request(undefined, Buffer.from([0xff, 0xd8, 0xff])));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Image content is invalid or could not be processed.",
    });
    expect(mocks.r2Send).not.toHaveBeenCalled();
  });

  it("rejects an image above the 4 MB input limit before sending it to public storage", async () => {
    const oversizedImage = Buffer.concat([
      JPEG_BYTES,
      Buffer.alloc(4 * 1024 * 1024 + 1 - JPEG_BYTES.length),
    ]);

    const response = await POST(request(undefined, oversizedImage));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "File too large. Maximum size is 4MB." });
    expect(mocks.r2Send).not.toHaveBeenCalled();
  });

  it("requires an authenticated account", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("rejects an authenticated session without a user ID before rate limiting", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "OWNER" } });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("does not report a successful placeholder upload when R2 is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("R2_BUCKET_NAME", "");
    vi.stubEnv("R2_PUBLIC_URL", "https://images.example.com");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Image storage is unavailable." });
  });

  it("keeps the placeholder upload available in local development without R2", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("R2_BUCKET_NAME", "");
    vi.stubEnv("R2_PUBLIC_URL", "");

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    });
  });

  it("rejects an incomplete public image URL before contacting R2", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Image storage is unavailable." });
  });

  it("rejects a public image URL with an empty query suffix", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "https://images.example.com?");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Image storage is unavailable." });
  });

  it("rejects listing-image uploads from non-owner roles before a hostel lookup", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });

    const response = await POST(request("hostel-1"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Only owners can upload listing images." });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("rejects uploads without a hostel ID from non-owner roles", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Only owners can upload listing images." });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("rejects an oversized hostel ID before a lookup", async () => {
    const response = await POST(request("h".repeat(129)));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid hostel." });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("does not reveal another owner's listing through the upload boundary", async () => {
    mocks.hostelFindFirst.mockResolvedValue(null);

    const response = await POST(request("hostel-1"));

    expect(response.status).toBe(404);
    expect(mocks.hostelFindFirst).toHaveBeenCalledWith({
      where: { id: "hostel-1", ownerId: "owner-1" },
      select: { ownerId: true, images: true },
    });
  });

  it("keeps listing-image upload available to administrators", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.hostelFindFirst.mockResolvedValue(null);

    const response = await POST(request("hostel-1"));

    expect(response.status).toBe(404);
    expect(mocks.hostelFindFirst).toHaveBeenCalledWith({
      where: { id: "hostel-1" },
      select: { ownerId: true, images: true },
    });
  });

  it("rejects a non-string hostel ID before a lookup", async () => {
    const response = await POST(request(new Blob(["hostel-1"], { type: "text/plain" })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid hostel." });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });
});
