// Path: src/app/api/owner/earnings/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payout: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/payouts", () => ({
  getPendingBalance: vi.fn(),
}));

import { GET, PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getPendingBalance } from "@/lib/payouts";

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function getRequest() {
  return new NextRequest("https://hostello.test/api/owner/earnings");
}

function patchRequest(body: unknown) {
  return new NextRequest("https://hostello.test/api/owner/earnings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/owner/earnings", () => {
  it("returns 401 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for a student session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    const res = await GET(getRequest());
    expect(res.status).toBe(403);
  });

  it("returns pending balance, bank details, and payout history", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(getPendingBalance).mockResolvedValue(45000);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      bankAccountTitle: "Jane Owner",
      bankAccountNumber: "PK00HABB0000000000000000",
      bankName: "HBL",
    } as any);
    vi.mocked(db.payout.findMany).mockResolvedValue([
      { id: "p1", amount: 30000, status: "PAID", reference: "REF-1", createdAt: new Date(), paidAt: new Date() },
    ] as any);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pendingBalance).toBe(45000);
    expect(body.hasBankDetails).toBe(true);
    expect(body.bankDetails.bankName).toBe("HBL");
    expect(body.payouts).toHaveLength(1);
  });

  it("reports hasBankDetails: false and bankDetails: null when nothing is on file", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(getPendingBalance).mockResolvedValue(0);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      bankAccountTitle: null,
      bankAccountNumber: null,
      bankName: null,
    } as any);
    vi.mocked(db.payout.findMany).mockResolvedValue([]);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(body.hasBankDetails).toBe(false);
    expect(body.bankDetails).toBeNull();
  });
});

describe("PATCH /api/owner/earnings", () => {
  it("returns 403 for a non-owner session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    const res = await PATCH(patchRequest({ bankAccountTitle: "A", bankAccountNumber: "1", bankName: "B" }));
    expect(res.status).toBe(403);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when a field is missing", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    const res = await PATCH(patchRequest({ bankAccountTitle: "A" }));
    expect(res.status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("updates bank details for the current owner only", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(db.user.update).mockResolvedValue({
      bankAccountTitle: "Jane Owner",
      bankAccountNumber: "PK00HABB0000000000000000",
      bankName: "HBL",
    } as any);

    const res = await PATCH(
      patchRequest({
        bankAccountTitle: "Jane Owner",
        bankAccountNumber: "PK00HABB0000000000000000",
        bankName: "HBL",
      }),
    );
    const body = await res.json();

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "usr_owner_1" } }),
    );
    expect(res.status).toBe(200);
    expect(body.bankDetails.bankName).toBe("HBL");
  });
});
