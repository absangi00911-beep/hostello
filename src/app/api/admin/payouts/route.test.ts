// Path: src/app/api/admin/payouts/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  PayoutServiceError: class extends Error {
    constructor(message: string, readonly statusCode: number) {
      super(message);
    }
  },
}));

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/admin-read-limit", () => ({ enforceAdminReadLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    booking: { groupBy: vi.fn() },
  },
}));

vi.mock("@/lib/payouts", () => ({
  createPayoutBatch: vi.fn(),
  PayoutServiceError: mocks.PayoutServiceError,
  getEligiblePayoutBookingWhere: vi.fn(() => ({
    status: { in: ["CONFIRMED", "COMPLETED"] },
    paymentStatus: "PAID",
    checkOut: { lte: new Date() },
    payoutId: null,
  })),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { GET, POST } from "./route";
import { auth } from "@/lib/auth/config";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";
import { db } from "@/lib/db";
import { createPayoutBatch, PayoutServiceError } from "@/lib/payouts";
import { rateLimit } from "@/lib/rate-limit";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function getRequest(query = "") {
  return new NextRequest(`https://hostello.test/api/admin/payouts${query}`);
}

function postRequest(body: unknown) {
  return new NextRequest("https://hostello.test/api/admin/payouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(enforceAdminReadLimit).mockResolvedValue(null);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 3_600_000 });
});

describe("GET /api/admin/payouts", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await GET(new NextRequest("https://hostello.test/api/admin/payouts"));

    expect(res.status).toBe(403);
  });

  it("returns 403 when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(new NextRequest("https://hostello.test/api/admin/payouts"));

    expect(res.status).toBe(403);
  });

  it("enforces the shared admin read quota before payout queries", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(enforceAdminReadLimit).mockResolvedValueOnce(NextResponse.json(
      { error: "Too many admin requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "30" } },
    ));

    const response = await GET(getRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(enforceAdminReadLimit).toHaveBeenCalledWith("usr_admin_1");
    expect(db.user.findMany).not.toHaveBeenCalled();
    expect(db.user.count).not.toHaveBeenCalled();
    expect(db.booking.groupBy).not.toHaveBeenCalled();
  });

  it("computes pending balance per owner and filters out owners with nothing to show", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.count).mockResolvedValue(1 as any);
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: "owner-1",
        name: "Owner One",
        email: "owner1@test.com",
        bankAccountTitle: "Jane Owner",
        bankAccountNumber: "12345",
        bankName: "HBL",
        hostels: [{ id: "hostel-1" }],
        payouts: [],
        _count: { payouts: 0 },
      },
    ] as any);
    vi.mocked(db.booking.groupBy).mockResolvedValue([
      { hostelId: "hostel-1", _sum: { total: 50000 } },
    ] as any);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "owner-1",
      pendingBalance: 50000,
      hasBankDetails: true,
    });
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 25,
      where: expect.objectContaining({
        role: "OWNER",
        OR: expect.arrayContaining([
          expect.objectContaining({ hostels: expect.any(Object) }),
          expect.objectContaining({ payouts: expect.any(Object) }),
        ]),
      }),
    }));
    expect(db.booking.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ["hostelId"],
      _sum: { total: true },
    }));
    expect(body).toMatchObject({ total: 1, page: 1, limit: 25, hasMore: false });
  });

  it("still lists an owner with zero pending balance if they have payout history", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.count).mockResolvedValue(1 as any);
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: "owner-1",
        name: "Owner One",
        email: "owner1@test.com",
        bankAccountNumber: "12345",
        bankName: "HBL",
        hostels: [],
        payouts: [{ id: "p1", amount: 10000, status: "PAID" }],
        _count: { payouts: 1 },
      },
    ] as any);
    vi.mocked(db.booking.groupBy).mockResolvedValue([] as any);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].pendingBalance).toBe(0);
  });

  it("does not mark an owner ready for payout when the account title is missing", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.count).mockResolvedValue(1 as any);
    vi.mocked(db.user.findMany).mockResolvedValue([{
      id: "owner-1",
      name: "Owner One",
      email: "owner1@test.com",
      bankAccountTitle: null,
      bankAccountNumber: "12345",
      bankName: "HBL",
      hostels: [],
      payouts: [],
      _count: { payouts: 0 },
    }] as any);
    vi.mocked(db.booking.groupBy).mockResolvedValue([] as any);

    const response = await GET(getRequest());
    const body = await response.json();

    expect(body.data[0].hasBankDetails).toBe(false);
  });

  it("caps page size and reports additional owner pages", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.count).mockResolvedValue(180 as any);
    vi.mocked(db.user.findMany).mockResolvedValue([{
      id: "owner-101",
      name: "Owner",
      email: "owner@test.com",
      bankAccountNumber: null,
      bankName: null,
      hostels: [],
      payouts: [],
      _count: { payouts: 0 },
    }] as any);
    vi.mocked(db.booking.groupBy).mockResolvedValue([] as any);

    const response = await GET(getRequest("?page=3&limit=100"));
    const body = await response.json();

    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 100, take: 50 }));
    expect(body).toMatchObject({ total: 180, page: 3, limit: 50, hasMore: true });
  });
});

describe("POST /api/admin/payouts", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));

    expect(res.status).toBe(403);
    expect(createPayoutBatch).not.toHaveBeenCalled();
  });

  it("limits payout generation per admin before parsing or claiming bookings", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });
    const req = new NextRequest("https://hostello.test/api/admin/payouts", {
      method: "POST",
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(createPayoutBatch).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid body", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await POST(postRequest({ ownerId: "not-a-cuid" }));

    expect(res.status).toBe(400);
    expect(createPayoutBatch).not.toHaveBeenCalled();
  });

  it("creates a batch and returns 201 on success", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(createPayoutBatch).mockResolvedValue({
      id: "pay-1",
      amount: 50000,
      status: "PENDING",
    } as any);

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));
    const body = await res.json();

    expect(createPayoutBatch).toHaveBeenCalledWith("clx000000000000000000001", "usr_admin_1");
    expect(res.status).toBe(201);
    expect(body.data.amount).toBe(50000);
  });

  it("surfaces typed payout conflicts without exposing unexpected failures", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(createPayoutBatch).mockRejectedValue(
      new PayoutServiceError("No eligible bookings to pay out for this owner.", 409),
    );

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("No eligible bookings to pay out for this owner.");
  });

  it("hides unexpected persistence error details", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(createPayoutBatch).mockRejectedValue(
      new Error("Database connection failed: sensitive-host.internal"),
    );

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Could not create payout batch. Please try again.",
    });
  });
});
