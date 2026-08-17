// Path: src/app/api/admin/bookings/[id]/refund/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/refunds", () => ({
  processRefund: vi.fn(),
}));

import { PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { processRefund } from "@/lib/refunds";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function req() {
  return new NextRequest("https://hostello.test/api/admin/bookings/bkg-1/refund", {
    method: "PATCH",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/admin/bookings/[id]/refund", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });

    expect(res.status).toBe(403);
    expect(processRefund).not.toHaveBeenCalled();
  });

  it("returns the booking and automatic: true on a successful gateway refund", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockResolvedValue({
      automatic: true,
      booking: { id: "bkg-1", paymentStatus: "REFUNDED" },
    } as any);

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(processRefund).toHaveBeenCalledWith("bkg-1", "usr_admin_1");
    expect(res.status).toBe(200);
    expect(body.automatic).toBe(true);
    expect(body.data.paymentStatus).toBe("REFUNDED");
  });

  it("returns automatic: false when the service fell back to manual", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockResolvedValue({
      automatic: false,
      booking: { id: "bkg-1", paymentStatus: "REFUNDED" },
    } as any);

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(body.automatic).toBe(false);
    expect(body.data.paymentStatus).toBe("REFUNDED");
  });

  it("surfaces the service's error message with a 400", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockRejectedValue(
      new Error("Cannot refund a booking with paymentStatus PENDING and status CANCELLED. A refund requires PAID + CANCELLED."),
    );

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("requires PAID + CANCELLED");
  });
});
