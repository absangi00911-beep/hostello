// Path: src/app/api/admin/hostels/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { hostel: { findUnique: vi.fn(), updateMany: vi.fn() }, $transaction: vi.fn() },
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/email-templates/listing-status", () => ({
  listingApprovedEmail: vi.fn().mockReturnValue({ to: "x", subject: "x", html: "x" }),
  listingSuspendedEmail: vi.fn().mockReturnValue({ to: "x", subject: "x", html: "x" }),
}));

vi.mock("@/lib/typesense-sync", () => ({
  indexSingleHostel: vi.fn().mockResolvedValue(undefined),
  removeHostelIndex: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}
function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function req(body: unknown) {
  return new NextRequest("https://hostello.test/api/admin/hostels", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function verifyReq(hostelId = "clx000000000000000000001") {
  return req({
    hostelId,
    action: "verify",
    verification: {
      ownerAuthorityChecked: true,
      locationChecked: true,
      listingDetailsChecked: true,
      photosChecked: true,
    },
  });
}

function makeHostel(overrides = {}) {
  return {
    id: "hst_1",
    status: "ACTIVE",
    verified: true,
    name: "Green View",
    owner: { id: "usr_owner_1", email: "owner@test.com", name: "Owner" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "PENDING_REVIEW", verified: false }) as any);
  vi.mocked(db.hostel.updateMany).mockResolvedValue({ count: 1 } as any);
  vi.mocked(db.$transaction).mockImplementation((async (callback: any) => callback({
    hostel: db.hostel,
    hostelVerificationReview: { create: vi.fn().mockResolvedValue({}) },
  })) as any);
});

describe("PATCH /api/admin/hostels", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

    expect(res.status).toBe(403);
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
  });

  it("limits moderation actions per admin before reading listing state", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(db.hostel.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid action", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "delete" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for a malformed hostelId", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PATCH(req({ hostelId: "not-a-cuid", action: "verify" }));

    expect(res.status).toBe(400);
  });

  describe("verify", () => {
    it("requires every listing verification check", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());

      const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

      expect(res.status).toBe(400);
      expect(db.hostel.updateMany).not.toHaveBeenCalled();
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("sets verified + ACTIVE, indexes to Typesense, sends the approved email and HOSTEL_APPROVED notification", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());
      vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "PENDING_REVIEW", verified: false }) as any);

      const res = await PATCH(verifyReq());
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "clx000000000000000000001", status: "PENDING_REVIEW" },
          data: { verified: true, status: "ACTIVE" },
        }),
      );
      expect(indexSingleHostel).toHaveBeenCalledWith("hst_1");
      expect(sendEmail).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "usr_owner_1", type: "HOSTEL_APPROVED" }),
      );
      expect(res.status).toBe(200);
    });
  });

  describe("activate", () => {
    it("also sends the approved email/notification (activate is treated as a fresh approval)", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());
      vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "SUSPENDED" }) as any);

      await PATCH(req({ hostelId: "clx000000000000000000001", action: "activate" }));
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "clx000000000000000000001", status: "SUSPENDED" },
        data: { status: "ACTIVE" },
      }));
      expect(indexSingleHostel).toHaveBeenCalledWith("hst_1");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "HOSTEL_APPROVED" }),
      );
    });
  });

  describe("suspend", () => {
    it("sets SUSPENDED, removes from the Typesense index, sends the suspended email and HOSTEL_REJECTED notification", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());
      vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);

      await PATCH(req({ hostelId: "clx000000000000000000001", action: "suspend", reason: "Fake photos" }));
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "clx000000000000000000001", status: "ACTIVE" },
        data: { status: "SUSPENDED" },
      }));
      expect(removeHostelIndex).toHaveBeenCalledWith("hst_1");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "HOSTEL_REJECTED" }),
      );
    });
  });

  it("returns 500 and doesn't crash if the update itself fails", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.updateMany).mockRejectedValue(new Error("Database unavailable"));

    const res = await PATCH(verifyReq());

    expect(res.status).toBe(500);
    expect(indexSingleHostel).not.toHaveBeenCalled();
  });

  it("rejects verify when the listing is no longer pending review", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);

    const res = await PATCH(verifyReq());

    expect(res.status).toBe(409);
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
    expect(indexSingleHostel).not.toHaveBeenCalled();
  });

  it("does not dispatch side effects when another action wins the status transition", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.updateMany).mockResolvedValue({ count: 0 } as any);

    const res = await PATCH(verifyReq());

    expect(res.status).toBe(409);
    expect(indexSingleHostel).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("still returns 200 even if the fire-and-forget email dispatch throws", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findUnique).mockResolvedValue(makeHostel({ status: "PENDING_REVIEW", verified: false }) as any);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend is down"));

    const res = await PATCH(verifyReq());

    expect(res.status).toBe(200);
  });
});
