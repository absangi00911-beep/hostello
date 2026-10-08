import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn(), updateMany: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/verification-storage", () => ({
  deleteVerificationDocument: vi.fn().mockResolvedValue(undefined),
  isVerificationObjectKey: (key: string, userId: string) => key.startsWith(`student-verifications/${userId}/`),
  isVerificationUploadKey: (key: string, userId: string) => key.startsWith(`student-verification-uploads/${userId}/`),
  promoteVerificationUpload: vi.fn().mockResolvedValue(`student-verifications/usr_student_1/${"b".repeat(32)}.pdf`),
  verifyUploadedDocument: vi.fn().mockResolvedValue({ contentType: "application/pdf", contentLength: 128 }),
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { deleteVerificationDocument, promoteVerificationUpload, verifyUploadedDocument } from "@/lib/verification-storage";

const key = `student-verification-uploads/usr_student_1/${"a".repeat(32)}.pdf`;
const reviewKey = `student-verifications/usr_student_1/${"b".repeat(32)}.pdf`;

function request(docKey: unknown) {
  return new NextRequest("https://hostello.test/api/user/verify-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docKey }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student_1", role: "STUDENT" } } as any);
  vi.mocked(db.user.findUnique).mockResolvedValue({ verificationStatus: "NONE", verificationDocUrl: null } as any);
  vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 } as any);
});

describe("POST /api/user/verify-student", () => {
  it("rejects a document key owned by another account", async () => {
    const response = await POST(request(`student-verifications/usr_other/${"a".repeat(32)}.pdf`));
    expect(response.status).toBe(400);
    expect(verifyUploadedDocument).not.toHaveBeenCalled();
  });

  it("does not allow owner or admin accounts to submit student verification", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student_1", role: "OWNER" } } as any);

    const response = await POST(request(key));

    expect(response.status).toBe(403);
    expect(verifyUploadedDocument).not.toHaveBeenCalled();
  });

  it("requires the object to exist and pass server-side file validation", async () => {
    vi.mocked(verifyUploadedDocument).mockRejectedValueOnce(new Error("invalid file"));
    const response = await POST(request(key));
    expect(response.status).toBe(400);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("stores the private object key and transitions the request to pending", async () => {
    const response = await POST(request(key));

    expect(response.status).toBe(200);
    expect(db.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "usr_student_1", verificationStatus: "NONE" },
      data: expect.objectContaining({ verificationDocUrl: reviewKey, verificationStatus: "PENDING" }),
    }));
    expect(promoteVerificationUpload).toHaveBeenCalledWith(key, "usr_student_1", "application/pdf");
  });

  it("deletes the newly uploaded object if a concurrent request changed the status", async () => {
    vi.mocked(db.user.updateMany).mockResolvedValueOnce({ count: 0 } as any);
    const response = await POST(request(key));

    expect(response.status).toBe(409);
    expect(deleteVerificationDocument).toHaveBeenCalledWith(reviewKey);
  });

  it("keeps the object if a concurrent replay already saved that same key", async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce({ verificationStatus: "NONE", verificationDocUrl: null } as any)
      .mockResolvedValueOnce({ verificationDocUrl: reviewKey } as any);
    vi.mocked(db.user.updateMany).mockResolvedValueOnce({ count: 0 } as any);

    const response = await POST(request(key));

    expect(response.status).toBe(409);
    expect(deleteVerificationDocument).not.toHaveBeenCalled();
  });
});
