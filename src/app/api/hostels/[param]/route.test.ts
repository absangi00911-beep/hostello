// Path: src/app/api/hostels/[param]/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/typesense-sync", () => ({
  removeHostelIndex: vi.fn().mockResolvedValue(undefined),
}));

import { GET, PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { removeHostelIndex } from "@/lib/typesense-sync";

function ownerSession(id = "usr_owner_1") {
  return { user: { id, role: "OWNER" } } as any;
}

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function makeHostel(overrides = {}) {
  return {
    id: "hst_1",
    ownerId: "usr_owner_1",
    status: "ACTIVE",
    slug: "green-view",
    name: "Green View",
    ...overrides,
  };
}

function patchReq(body: unknown) {
  return new NextRequest("https://hostello.test/api/hostels/hst_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function listingEditBody(overrides = {}) {
  const image = `https://images.hostello.test/${"x".repeat(1_000)}.jpg`;
  return {
    name: "Green View Updated",
    description: "A comfortable student hostel with secure rooms and shared facilities.",
    city: "Lahore",
    area: "Gulberg",
    address: "123 Main Road, Lahore",
    gender: "MIXED",
    pricePerMonth: 18_000,
    rooms: 10,
    capacity: 30,
    cancellationPolicy: "STANDARD",
    minStay: 1,
    amenities: ["WiFi"],
    images: [image, image, image],
    coverImage: image,
    rules: ["Keep shared spaces clean"],
    status: "PENDING_REVIEW",
    ...overrides,
  };
}

function paramsFor(param: string) {
  return { params: Promise.resolve({ param }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60 * 60 * 1000 });
  vi.mocked(db.hostel.updateMany).mockResolvedValue({ count: 1 } as any);
});

describe("GET /api/hostels/[param]", () => {
  it("requires an admin session because the detail includes owner contact information", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/green-view"),
      paramsFor("green-view"),
    );

    expect(res.status).toBe(401);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("rejects non-admin sessions", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/green-view"),
      paramsFor("green-view"),
    );

    expect(res.status).toBe(403);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("returns the hostel when found by id or slug", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/green-view"),
      paramsFor("green-view"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ id: "hst_1", name: "Green View" });
    expect(db.hostel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: "green-view" }, { slug: "green-view" }] },
      }),
    );
  });

  it("returns 404 when nothing matches", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/nope"),
      paramsFor("nope"),
    );

    expect(res.status).toBe(404);
  });

  it("returns 500 when the lookup throws", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findFirst).mockRejectedValue(new Error("db down"));

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/hst_1"),
      paramsFor("hst_1"),
    );

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/hostels/[param]", () => {
  it("returns 403 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(403);
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-owner role", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_1", role: "STUDENT" } } as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(403);
  });

  it("throttles owner listing changes before reading the hostel", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 60 * 60 * 1000 });

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith("hostel-edit:usr_owner_1", {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the hostel doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("missing"));

    expect(res.status).toBe(404);
  });

  it("returns the same 404 for a hostel owned by someone else", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession("usr_someone_else"));
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(404);
    expect(db.hostel.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ id: "hst_1" }, { slug: "hst_1" }], ownerId: "usr_someone_else" },
      select: { id: true, status: true, slug: true },
    });
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 for a transition that isn't allowed from this endpoint", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);

    const res = await PATCH(patchReq({ status: "PENDING_REVIEW" }), paramsFor("hst_1"));

    expect(res.status).toBe(400);
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
  });

  it("moves ACTIVE to DRAFT for the owning user", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);
    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ id: "hst_1", status: "DRAFT" });
    expect(db.hostel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "hst_1", ownerId: "usr_owner_1", status: "ACTIVE" },
        data: { status: "DRAFT" },
      }),
    );
  });

  it("moves DRAFT to PENDING_REVIEW for the owning user", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "DRAFT" }) as any);
    const res = await PATCH(patchReq({ status: "PENDING_REVIEW" }), paramsFor("hst_1"));

    expect(res.status).toBe(200);
    expect(db.hostel.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "hst_1", ownerId: "usr_owner_1", status: "DRAFT" },
      data: { status: "PENDING_REVIEW" },
    }));
  });

  it("saves full listing edits above the status-toggle body size and sends them for review", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);
    const res = await PATCH(patchReq(listingEditBody()), paramsFor("hst_1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Listing updated and submitted for review.");
    expect(db.hostel.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "hst_1", ownerId: "usr_owner_1", status: "ACTIVE" },
      data: expect.objectContaining({
        name: "Green View Updated",
        images: expect.arrayContaining([expect.stringContaining("https://images.hostello.test/")]),
        status: "PENDING_REVIEW",
      }),
    }));
    expect(removeHostelIndex).toHaveBeenCalledWith("hst_1");
  });

  it("does not allow owners to edit suspended listings", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "SUSPENDED" }) as any);

    const res = await PATCH(patchReq(listingEditBody()), paramsFor("hst_1"));

    expect(res.status).toBe(409);
    expect(db.hostel.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite a concurrent admin status change while editing a listing", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);
    vi.mocked(db.hostel.updateMany).mockResolvedValue({ count: 0 } as any);

    const res = await PATCH(patchReq(listingEditBody()), paramsFor("hst_1"));

    expect(res.status).toBe(409);
    expect(removeHostelIndex).not.toHaveBeenCalled();
  });

  it("does not apply a stale owner status transition", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);
    vi.mocked(db.hostel.updateMany).mockResolvedValue({ count: 0 } as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(409);
  });
});
