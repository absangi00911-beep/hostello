import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/verification-storage", () => ({
  storeVerificationUpload: vi.fn(),
  MAX_VERIFICATION_FILE_BYTES: 4 * 1024 * 1024,
  hasVerificationFileSignature: (contentType: string, bytes: Uint8Array) =>
    contentType === "application/pdf" && new TextDecoder().decode(bytes).startsWith("%PDF-"),
  isVerificationContentType: (value: string) => ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(value),
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { storeVerificationUpload } from "@/lib/verification-storage";

const key = `student-verification-uploads/usr_student_1/${"a".repeat(32)}.pdf`;
const pdf = () => new Blob(["%PDF-1.7 test document"], { type: "application/pdf" });

function request(file: Blob | null) {
  const formData = new FormData();
  if (file) formData.append("file", file, "student-id.pdf");
  return new NextRequest("https://hostello.test/api/user/verify-student/upload", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student_1", role: "STUDENT" } } as any);
  vi.mocked(db.user.findUnique).mockResolvedValue({ verificationStatus: "NONE" } as any);
  vi.mocked(storeVerificationUpload).mockResolvedValue(key);
});

describe("POST /api/user/verify-student/upload", () => {
  it("requires an authenticated account", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await POST(request(pdf()));
    expect(response.status).toBe(401);
  });

  it("does not store documents for non-student roles", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student_1", role: "ADMIN" } } as any);

    const response = await POST(request(pdf()));

    expect(response.status).toBe(403);
    expect(storeVerificationUpload).not.toHaveBeenCalled();
  });

  it("rejects unsupported media types before storing the upload", async () => {
    const response = await POST(request(new Blob(["<html>"], { type: "text/html" })));
    expect(response.status).toBe(400);
    expect(storeVerificationUpload).not.toHaveBeenCalled();
  });

  it("rejects content that does not match its declared media type before storage", async () => {
    const response = await POST(request(new Blob(["<html>"], { type: "application/pdf" })));

    expect(response.status).toBe(400);
    expect(storeVerificationUpload).not.toHaveBeenCalled();
  });

  it("rejects files larger than four MiB before storage", async () => {
    const oversized = new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: "application/pdf" });
    const response = await POST(request(oversized));

    expect(response.status).toBe(413);
    expect(storeVerificationUpload).not.toHaveBeenCalled();
  });

  it("prevents uploading another document while one is pending", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ verificationStatus: "PENDING" } as any);
    const response = await POST(request(pdf()));
    expect(response.status).toBe(409);
    expect(storeVerificationUpload).not.toHaveBeenCalled();
  });

  it("stores a bounded upload in the private staging prefix", async () => {
    const response = await POST(request(pdf()));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ key });
    expect(storeVerificationUpload).toHaveBeenCalledWith("usr_student_1", "application/pdf", expect.any(Uint8Array));
  });
});
