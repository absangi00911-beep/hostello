// Path: src/app/api/hostels/[param]/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET, PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

function ownerSession(id = "usr_owner_1") {
  return { user: { id, role: "OWNER" } } as any;
}

function makeHostel(overrides = {}) {
  return {
    id: "hst_1",
    ownerId: "usr_owner_1",
    status: "ACTIVE",
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

function paramsFor(param: string) {
  return { params: Promise.resolve({ param }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/hostels/[param]", () => {
  it("returns the hostel when found by id or slug", async () => {
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
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await GET(
      new NextRequest("https://hostello.test/api/hostels/nope"),
      paramsFor("nope"),
    );

    expect(res.status).toBe(404);
  });

  it("returns 500 when the lookup throws", async () => {
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
    expect(db.hostel.update).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-owner role", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_1", role: "STUDENT" } } as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(403);
  });

  it("returns 404 when the hostel doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("missing"));

    expect(res.status).toBe(404);
  });

  it("returns 403 when the session user doesn't own the hostel", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession("usr_someone_else"));
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));

    expect(res.status).toBe(403);
    expect(db.hostel.update).not.toHaveBeenCalled();
  });

  it("returns 400 for a transition that isn't allowed from this endpoint", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);

    const res = await PATCH(patchReq({ status: "PENDING_REVIEW" }), paramsFor("hst_1"));

    expect(res.status).toBe(400);
    expect(db.hostel.update).not.toHaveBeenCalled();
  });

  it("moves ACTIVE to DRAFT for the owning user", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "ACTIVE" }) as any);
    vi.mocked(db.hostel.update).mockResolvedValue({ id: "hst_1", status: "DRAFT" } as any);

    const res = await PATCH(patchReq({ status: "DRAFT" }), paramsFor("hst_1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ id: "hst_1", status: "DRAFT" });
    expect(db.hostel.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "hst_1" }, data: { status: "DRAFT" } }),
    );
  });

  it("moves DRAFT to PENDING_REVIEW for the owning user", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel({ status: "DRAFT" }) as any);
    vi.mocked(db.hostel.update).mockResolvedValue({ id: "hst_1", status: "PENDING_REVIEW" } as any);

    const res = await PATCH(patchReq({ status: "PENDING_REVIEW" }), paramsFor("hst_1"));

    expect(res.status).toBe(200);
  });
});
