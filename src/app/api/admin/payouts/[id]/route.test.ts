// Path: src/app/api/admin/payouts/[id]/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/payouts", () => ({
  markPayoutPaid: vi.fn(),
}));

import { PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { markPayoutPaid } from "@/lib/payouts";

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
});

describe("PATCH /api/admin/payouts/[id]", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });

    expect(res.status).toBe(403);
    expect(markPayoutPaid).not.toHaveBeenCalled();
  });

  it("marks the payout paid with the given reference", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockResolvedValue({
      id: "pay-1",
      status: "PAID",
      reference: "BANK-1",
    } as any);

    const res = await PATCH(patchRequest({ reference: "BANK-1" }), {
      params: Promise.resolve({ id: "pay-1" }),
    });
    const body = await res.json();

    expect(markPayoutPaid).toHaveBeenCalledWith("pay-1", "usr_admin_1", "BANK-1");
    expect(res.status).toBe(200);
    expect(body.data.status).toBe("PAID");
  });

  it("works without a reference (optional field)", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockResolvedValue({ id: "pay-1", status: "PAID" } as any);

    const res = await PATCH(patchRequest({}), { params: Promise.resolve({ id: "pay-1" }) });

    expect(res.status).toBe(200);
    expect(markPayoutPaid).toHaveBeenCalledWith("pay-1", "usr_admin_1", undefined);
  });

  it("returns 400 with the service's message when the payout isn't PENDING", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(new Error("Cannot mark a PAID payout as paid."));

    const res = await PATCH(patchRequest({}), { params: Promise.resolve({ id: "pay-1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot mark a PAID payout as paid.");
  });

  it("returns 400 when the payout doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(markPayoutPaid).mockRejectedValue(new Error("Payout not found."));

    const res = await PATCH(patchRequest({}), { params: Promise.resolve({ id: "nonexistent" }) });

    expect(res.status).toBe(400);
  });
});
