import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  hostelFindFirst: vi.fn(),
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

import { POST } from "./route";

function image() {
  return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" });
}

function request(hostelId?: string | Blob) {
  const formData = new FormData();
  formData.append("file", image(), "room.jpg");
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
