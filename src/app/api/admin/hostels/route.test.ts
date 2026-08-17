// Path: src/app/api/admin/hostels/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { hostel: { update: vi.fn() } },
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
});

describe("PATCH /api/admin/hostels", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

    expect(res.status).toBe(403);
    expect(db.hostel.update).not.toHaveBeenCalled();
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
    it("sets verified + ACTIVE, indexes to Typesense, sends the approved email and HOSTEL_APPROVED notification", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());
      vi.mocked(db.hostel.update).mockResolvedValue(makeHostel() as any);

      const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { verified: true, status: "ACTIVE" } }),
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
      vi.mocked(db.hostel.update).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);

      await PATCH(req({ hostelId: "clx000000000000000000001", action: "activate" }));
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "ACTIVE" } }));
      expect(indexSingleHostel).toHaveBeenCalledWith("hst_1");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "HOSTEL_APPROVED" }),
      );
    });
  });

  describe("suspend", () => {
    it("sets SUSPENDED, removes from the Typesense index, sends the suspended email and HOSTEL_REJECTED notification", async () => {
      vi.mocked(auth).mockResolvedValue(adminSession());
      vi.mocked(db.hostel.update).mockResolvedValue(makeHostel({ status: "SUSPENDED" }) as any);

      await PATCH(req({ hostelId: "clx000000000000000000001", action: "suspend", reason: "Fake photos" }));
      await new Promise((r) => setTimeout(r, 0));

      expect(db.hostel.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "SUSPENDED" } }));
      expect(removeHostelIndex).toHaveBeenCalledWith("hst_1");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "HOSTEL_REJECTED" }),
      );
    });
  });

  it("returns 500 and doesn't crash if the update itself fails", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.update).mockRejectedValue(new Error("Record not found"));

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

    expect(res.status).toBe(500);
    expect(indexSingleHostel).not.toHaveBeenCalled();
  });

  it("still returns 200 even if the fire-and-forget email dispatch throws", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.update).mockResolvedValue(makeHostel() as any);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend is down"));

    const res = await PATCH(req({ hostelId: "clx000000000000000000001", action: "verify" }));

    expect(res.status).toBe(200);
  });
});
