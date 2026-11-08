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
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/payouts", () => ({
  getPendingBalance: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

const notify = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  runAfterResponse: vi.fn((_name: string, task: () => unknown) => { void task(); }),
  logOperationalEvent: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendEmail: notify.sendEmail, escapeHtml: (v: string) => v }));
vi.mock("@/lib/background", () => ({ runAfterResponse: notify.runAfterResponse }));
vi.mock("@/lib/operational-logger", () => ({ logOperationalEvent: notify.logOperationalEvent }));
vi.mock("@/lib/app-url", () => ({
  getAppOrigin: () => "https://hostello.test",
  getAppUrl: () => "https://hostello.test",
}));

import { GET, PATCH } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getPendingBalance } from "@/lib/payouts";
import { rateLimit } from "@/lib/rate-limit";

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function getRequest(query = "") {
  return new NextRequest(`https://hostello.test/api/owner/earnings${query}`);
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
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 4, resetAt: 0 });
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
    vi.mocked(db.payout.count).mockResolvedValue(1 as any);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pendingBalance).toBe(45000);
    expect(body.hasBankDetails).toBe(true);
    expect(body.bankDetails.bankName).toBe("HBL");
    expect(body.payouts).toHaveLength(1);
    expect(body).toMatchObject({ payoutTotal: 1, payoutPage: 1, payoutLimit: 20, payoutHasMore: false });
  });

  it("throttles earnings reads before loading balances or payout data", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const res = await GET(getRequest());

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(rateLimit).toHaveBeenCalledWith("owner-earnings-read:usr_owner_1", {
      limit: 30,
      windowMs: 60_000,
    });
    expect(getPendingBalance).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.payout.findMany).not.toHaveBeenCalled();
    expect(db.payout.count).not.toHaveBeenCalled();
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
    vi.mocked(db.payout.count).mockResolvedValue(0 as any);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(body.hasBankDetails).toBe(false);
    expect(body.bankDetails).toBeNull();
  });

  it("does not treat an account without a title as complete payout details", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(getPendingBalance).mockResolvedValue(0);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      bankAccountTitle: null,
      bankAccountNumber: "PK00HABB0000000000000000",
      bankName: "HBL",
    } as any);
    vi.mocked(db.payout.findMany).mockResolvedValue([] as any);
    vi.mocked(db.payout.count).mockResolvedValue(0 as any);

    const response = await GET(getRequest());
    const body = await response.json();

    expect(body.hasBankDetails).toBe(false);
  });

  it("caps payout-history pages and returns navigation metadata", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(getPendingBalance).mockResolvedValue(0);
    vi.mocked(db.user.findUnique).mockResolvedValue(null as any);
    vi.mocked(db.payout.findMany).mockResolvedValue([] as any);
    vi.mocked(db.payout.count).mockResolvedValue(160 as any);

    const response = await GET(getRequest("?page=3&limit=100"));
    const body = await response.json();

    expect(db.payout.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: "usr_owner_1" },
      skip: 100,
      take: 50,
    }));
    expect(body).toMatchObject({ payoutTotal: 160, payoutPage: 3, payoutLimit: 50, payoutHasMore: true });
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

  it("throttles bank-detail changes before parsing or writing", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: 60_000 });

    const res = await PATCH(patchRequest({ bankAccountTitle: "A", bankAccountNumber: "1", bankName: "B" }));

    expect(res.status).toBe(429);
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

  describe("owner notification", () => {
    const previous = {
      name: "Jane Owner",
      email: "jane@owner.example",
      bankAccountTitle: "Jane Owner",
      bankAccountNumber: "PK00HABB0000000011111111",
      bankName: "HBL",
    };
    const submitted = {
      bankAccountTitle: "Jane Owner",
      bankAccountNumber: "PK00MEZN0000000099999999",
      bankName: "Meezan",
    };

    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(ownerSession());
      vi.mocked(db.user.findUnique).mockResolvedValue(previous as any);
      vi.mocked(db.user.update).mockResolvedValue(submitted as any);
    });

    it("emails the account owner when the details change, without the full account number", async () => {
      const res = await PATCH(patchRequest(submitted));

      expect(res.status).toBe(200);
      expect(notify.sendEmail).toHaveBeenCalledTimes(1);
      const mail = notify.sendEmail.mock.calls[0][0];
      expect(mail.to).toBe("jane@owner.example");
      expect(mail.html).toContain("ending 9999");
      expect(mail.html).toContain("ending 1111");
      expect(mail.html).not.toContain(submitted.bankAccountNumber);
      expect(mail.html).not.toContain(previous.bankAccountNumber);
      expect(mail.html).toContain("https://hostello.test/forgot-password");
      expect(notify.logOperationalEvent).toHaveBeenCalledWith(
        "info", "owner.bank_details.changed", { owner_id: "usr_owner_1" },
      );
    });

    it("stays quiet when the owner re-saves identical details", async () => {
      vi.mocked(db.user.update).mockResolvedValue({
        bankAccountTitle: previous.bankAccountTitle,
        bankAccountNumber: previous.bankAccountNumber,
        bankName: previous.bankName,
      } as any);

      const res = await PATCH(patchRequest(previous));

      expect(res.status).toBe(200);
      expect(notify.sendEmail).not.toHaveBeenCalled();
      expect(notify.logOperationalEvent).not.toHaveBeenCalled();
    });

    it("also notifies when details are set for the first time", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        ...previous, bankAccountTitle: null, bankAccountNumber: null, bankName: null,
      } as any);

      await PATCH(patchRequest(submitted));

      expect(notify.sendEmail).toHaveBeenCalledTimes(1);
      expect(notify.sendEmail.mock.calls[0][0].html).toContain("none");
    });

    it("still saves the details if sending the email fails", async () => {
      notify.sendEmail.mockRejectedValueOnce(new Error("resend down"));

      const res = await PATCH(patchRequest(submitted));

      expect(res.status).toBe(200);
      expect(db.user.update).toHaveBeenCalledTimes(1);
    });
  });
});
