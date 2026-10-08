// Path: src/app/api/admin/bookings/[id]/refund/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  RefundServiceError: class extends Error {
    constructor(message: string, readonly statusCode: number) {
      super(message);
    }
  },
}));

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/refunds", () => ({
  processRefund: vi.fn(),
  confirmManualRefund: vi.fn(),
  RefundServiceError: mocks.RefundServiceError,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { confirmManualRefund, processRefund, RefundServiceError } from "@/lib/refunds";
import { rateLimit } from "@/lib/rate-limit";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function req(manualConfirmation = false) {
  return new NextRequest("https://hostello.test/api/admin/bookings/bkg-1/refund", {
    method: "PATCH",
    ...(manualConfirmation && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualConfirmation: true }),
    }),
  });
}

function oversizedReq() {
  return new NextRequest("https://hostello.test/api/admin/bookings/bkg-1/refund", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Content-Length": "2048" },
    body: "{}",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 3_600_000 });
});

describe("PATCH /api/admin/bookings/[id]/refund", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });

    expect(res.status).toBe(403);
    expect(processRefund).not.toHaveBeenCalled();
  });

  it("limits refund actions per admin before starting the provider operation", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(processRefund).not.toHaveBeenCalled();
    expect(confirmManualRefund).not.toHaveBeenCalled();
  });

  it("rejects an oversized action body before starting a refund", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PATCH(oversizedReq(), { params: Promise.resolve({ id: "bkg-1" }) });

    expect(res.status).toBe(413);
    expect(processRefund).not.toHaveBeenCalled();
    expect(confirmManualRefund).not.toHaveBeenCalled();
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

  it("keeps the booking paid when Safepay does not confirm the refund", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockResolvedValue({
      automatic: false,
      manualConfirmed: false,
      booking: { id: "bkg-1", paymentStatus: "PAID" },
    } as any);

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(body.automatic).toBe(false);
    expect(body.manualConfirmed).toBe(false);
    expect(body.data.paymentStatus).toBe("PAID");
  });

  it("records a manual refund only after the admin submits explicit confirmation", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(confirmManualRefund).mockResolvedValue({
      automatic: false,
      manualConfirmed: true,
      booking: { id: "bkg-1", paymentStatus: "REFUNDED" },
    } as any);

    const res = await PATCH(req(true), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(confirmManualRefund).toHaveBeenCalledWith("bkg-1", "usr_admin_1");
    expect(processRefund).not.toHaveBeenCalled();
    expect(body.manualConfirmed).toBe(true);
    expect(body.data.paymentStatus).toBe("REFUNDED");
  });

  it("surfaces typed refund conflicts without exposing unexpected failures", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockRejectedValue(
      new RefundServiceError("Cannot refund a booking with paymentStatus PENDING and status CANCELLED. A refund requires PAID + CANCELLED.", 409),
    );

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain("requires PAID + CANCELLED");
  });

  it("hides unexpected persistence error details", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(processRefund).mockRejectedValue(
      new Error("Database connection failed: sensitive-host.internal"),
    );

    const res = await PATCH(req(), { params: Promise.resolve({ id: "bkg-1" }) });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Could not process the refund. Please try again." });
  });
});
