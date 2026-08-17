// Path: src/app/api/admin/payouts/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/payouts", () => ({
  createPayoutBatch: vi.fn(),
}));

import { GET, POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createPayoutBatch } from "@/lib/payouts";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
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

  it("computes pending balance per owner and filters out owners with nothing to show", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: "owner-1",
        name: "Owner One",
        email: "owner1@test.com",
        bankAccountNumber: "12345",
        bankName: "HBL",
        hostels: [{ bookings: [{ total: 30000 }, { total: 20000 }] }],
        payouts: [],
      },
      {
        id: "owner-2",
        name: "Owner Two, nothing pending or paid",
        email: "owner2@test.com",
        bankAccountNumber: null,
        bankName: null,
        hostels: [{ bookings: [] }],
        payouts: [],
      },
    ] as any);

    const res = await GET(new NextRequest("https://hostello.test/api/admin/payouts"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "owner-1",
      pendingBalance: 50000,
      hasBankDetails: true,
    });
  });

  it("still lists an owner with zero pending balance if they have payout history", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: "owner-1",
        name: "Owner One",
        email: "owner1@test.com",
        bankAccountNumber: "12345",
        bankName: "HBL",
        hostels: [{ bookings: [] }],
        payouts: [{ id: "p1", amount: 10000, status: "PAID" }],
      },
    ] as any);

    const res = await GET(new NextRequest("https://hostello.test/api/admin/payouts"));
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].pendingBalance).toBe(0);
  });
});

describe("POST /api/admin/payouts", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));

    expect(res.status).toBe(403);
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

  it("surfaces the service's error message with a 400 rather than a generic 500", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(createPayoutBatch).mockRejectedValue(
      new Error("No eligible bookings to pay out for this owner."),
    );

    const res = await POST(postRequest({ ownerId: "clx000000000000000000001" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("No eligible bookings to pay out for this owner.");
  });
});
