import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/verification-storage", () => ({
  getVerificationDocument: vi.fn(),
  isVerificationContentType: (value: string) => ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(value),
  isVerificationObjectKey: (key: string, userId: string) => key.startsWith(`student-verifications/${userId}/`),
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getVerificationDocument } from "@/lib/verification-storage";

const key = `student-verifications/usr_student_1/${"a".repeat(32)}.jpg`;
const request = new NextRequest("https://hostello.test/api/admin/verifications/usr_student_1/document");
const context = { params: Promise.resolve({ userId: "usr_student_1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "usr_admin_1", role: "ADMIN" } } as any);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  vi.mocked(db.user.findUnique).mockResolvedValue({ verificationStatus: "PENDING", verificationDocUrl: key } as any);
  vi.mocked(getVerificationDocument).mockResolvedValue({
    Body: { transformToWebStream: () => new Blob(["private image bytes"]).stream() },
    ContentType: "image/jpeg",
    ContentLength: 19,
  } as any);
});

describe("GET /api/admin/verifications/[userId]/document", () => {
  it("does not fetch the private object for non-admins", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student_1", role: "STUDENT" } } as any);
    const response = await GET(request, context);
    expect(response.status).toBe(403);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(getVerificationDocument).not.toHaveBeenCalled();
  });

  it("limits document reads before the user or private-object lookup", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(request, context);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(rateLimit).toHaveBeenCalledWith("admin-verification-document:usr_admin_1", {
      limit: 30,
      windowMs: 60_000,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(getVerificationDocument).not.toHaveBeenCalled();
  });

  it("streams the private file through an admin-only, non-cacheable response", async () => {
    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("private image bytes");
    expect(rateLimit.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(db.user.findUnique).mock.invocationCallOrder[0],
    );
    expect(getVerificationDocument).toHaveBeenCalledWith(key);
  });

  it("does not fetch a cleared or non-pending verification document", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ verificationStatus: "APPROVED", verificationDocUrl: key } as any);
    const response = await GET(request, context);
    expect(response.status).toBe(404);
    expect(getVerificationDocument).not.toHaveBeenCalled();
  });
});
