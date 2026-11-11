// Path: src/app/api/admin/payouts/[id]/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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

vi.mock("@/lib/payouts", () => ({
  approvePayoutBatch: vi.fn(),
  markPayoutPaid: vi.fn(),
  PayoutServiceError: mocks.PayoutServiceError,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { approvePayoutBatch, markPayoutPaid, PayoutServiceError } from "@/lib/payouts";
import { rateLimit } from "@/lib/rate-limit";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function patchRequest(body: unknown) {
  return new NextRequest("https://hostello.test/api/admin/payouts/pay-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 3_600_000 });
});

describe("PATCH /api/admin/payouts/[id]", () => {
  it("returns 401 for an unauthenticated caller", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(patchRequest({ action: "approve" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });
    expect(res.status).toBe(401);
    expect(approvePayoutBatch).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });

    expect(res.status).toBe(403);
    expect(markPayoutPaid).not.toHaveBeenCalled();
  });

  it("accepts approval and derives the approving admin from the authenticated session", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(approvePayoutBatch).mockResolvedValue({
      id: "pay-1",
      status: "APPROVED",
      approvedBy: "usr_admin_1",
      approvedAt: new Date("2026-11-09T12:00:00.000Z"),
      destinationSnapshot: "encrypted-destination",
    } as any);

    const res = await PATCH(patchRequest({ action: "approve" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });
    expect(res.status).toBe(200);
    expect(approvePayoutBatch).toHaveBeenCalledWith("pay-1", "usr_admin_1");
    expect(await res.json()).toEqual({
      data: {
        id: "pay-1",
        status: "APPROVED",
        approvedBy: "usr_admin_1",
        approvedAt: "2026-11-09T12:00:00.000Z",
      },
    });
  });

  it("rejects invalid approval payloads and caller-supplied actor IDs", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    const res = await PATCH(patchRequest({ action: "approve", approverId: "usr_admin_2" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });
    expect(res.status).toBe(400);
    expect(approvePayoutBatch).not.toHaveBeenCalled();
  });

  it("returns the disabled-settlement readiness error without marking a payout paid", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(new PayoutServiceError(
      "Payout settlement is disabled until custody, independent approval, and reconciliation are approved and ready.",
      503,
    ));

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });
    const body = await res.json();

    expect(markPayoutPaid).toHaveBeenCalledWith("pay-1", "usr_admin_1", "BANK-1");
    expect(res.status).toBe(503);
    expect(body.error).toContain("Payout settlement is disabled");
  });

  it("limits payout status changes before parsing or writing", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const req = new NextRequest("https://hostello.test/api/admin/payouts/pay-1", {
      method: "PATCH",
      body: "not-json",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "pay-1" }) });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(markPayoutPaid).not.toHaveBeenCalled();
  });

  it("rejects an oversized payout ID before parsing or writing", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PATCH(patchRequest({}), {
      params: Promise.resolve({ id: "x".repeat(129) }),
    });

    expect(res.status).toBe(400);
    expect(markPayoutPaid).not.toHaveBeenCalled();
  });

  it("requires a nonblank transfer reference", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PATCH(patchRequest({}), { params: Promise.resolve({ id: "pay-1" }) });

    expect(res.status).toBe(400);
    expect(markPayoutPaid).not.toHaveBeenCalled();
  });

  it("returns 400 with the service's message when the payout isn't PENDING", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(
      new PayoutServiceError("Cannot mark a PAID payout as paid.", 409),
    );

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), { params: Promise.resolve({ id: "pay-1" }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Cannot mark a PAID payout as paid.");
  });

  it("returns 400 when the payout doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(new PayoutServiceError("Payout not found.", 404));

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), { params: Promise.resolve({ id: "nonexistent" }) });

    expect(res.status).toBe(404);
  });

  it("hides unexpected persistence error details", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(
      new Error("Database connection failed: sensitive-host.internal"),
    );

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), { params: Promise.resolve({ id: "pay-1" }) });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Could not update payout. Please try again." });
  });
});
