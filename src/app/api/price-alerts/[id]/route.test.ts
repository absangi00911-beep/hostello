import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  alertUpdateMany: vi.fn(),
  alertFindFirst: vi.fn(),
  alertDeleteMany: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    priceAlert: {
      updateMany: mocks.alertUpdateMany,
      findFirst: mocks.alertFindFirst,
      deleteMany: mocks.alertDeleteMany,
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { DELETE, PATCH } from "@/app/api/price-alerts/[id]/route";

const USER_ID = "student-1";
const ALERT_ID = "alert-1";
const ACTIVE_ALERT = {
  id: ALERT_ID,
  userId: USER_ID,
  hostel: { status: "ACTIVE" },
};
const CONTEXT = { params: Promise.resolve({ id: ALERT_ID }) };

function patchRequest() {
  return new NextRequest(`https://hostello.test/api/price-alerts/${ALERT_ID}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ targetPrice: 18_000 }),
  });
}

describe("price-alert listing privacy boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: USER_ID, role: "STUDENT" } });
    mocks.alertUpdateMany.mockResolvedValue({ count: 1 });
    mocks.alertFindFirst.mockResolvedValue({
      id: ALERT_ID,
      userId: USER_ID,
      targetPrice: 18_000,
      hostel: { id: "hostel-1", name: "Public Hostel", status: "ACTIVE" },
    });
    mocks.alertDeleteMany.mockResolvedValue({ count: 1 });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
  });

  it("rate-limits edits before looking up the alert", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await PATCH(patchRequest(), CONTEXT);

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.rateLimit).toHaveBeenCalledWith(`price-alert-action:${USER_ID}`, {
      limit: 60,
      windowMs: 60_000,
    });
    expect(mocks.alertFindFirst).not.toHaveBeenCalled();
  });

  it("conditionally updates and returns details only while the listing remains active", async () => {
    const response = await PATCH(patchRequest(), CONTEXT);

    expect(response.status).toBe(200);
    expect(mocks.alertUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: ALERT_ID,
        userId: USER_ID,
        hostel: { is: { status: "ACTIVE" } },
      },
      data: { targetPrice: 18_000 },
    }));
    expect(mocks.alertFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: ALERT_ID,
        userId: USER_ID,
        hostel: { is: { status: "ACTIVE" } },
      },
    }));
  });

  it("does not return hostel details if moderation wins the update race", async () => {
    mocks.alertUpdateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(patchRequest(), CONTEXT);

    expect(response.status).toBe(404);
    expect(mocks.alertFindFirst).toHaveBeenCalledTimes(1);
  });

  it("hides alerts whose hostel is already inactive", async () => {
    mocks.alertFindFirst.mockResolvedValue({
      ...ACTIVE_ALERT,
      hostel: { status: "SUSPENDED" },
    });

    const response = await PATCH(patchRequest(), CONTEXT);

    expect(response.status).toBe(404);
    expect(mocks.alertUpdateMany).not.toHaveBeenCalled();
  });

  it("deletes only an alert owned by the current student", async () => {
    const response = await DELETE(
      new NextRequest(`https://hostello.test/api/price-alerts/${ALERT_ID}`, { method: "DELETE" }),
      CONTEXT,
    );

    expect(response.status).toBe(200);
    expect(mocks.alertDeleteMany).toHaveBeenCalledWith({
      where: { id: ALERT_ID, userId: USER_ID },
    });
  });

  it("rate-limits deletes before looking up the alert", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await DELETE(
      new NextRequest(`https://hostello.test/api/price-alerts/${ALERT_ID}`, { method: "DELETE" }),
      CONTEXT,
    );

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.alertFindFirst).not.toHaveBeenCalled();
    expect(mocks.alertDeleteMany).not.toHaveBeenCalled();
  });
  it("returns the same not-found result for an alert outside this student's account", async () => {
    mocks.alertFindFirst.mockResolvedValueOnce(null);

    const response = await PATCH(patchRequest(), CONTEXT);

    expect(response.status).toBe(404);
    expect(mocks.alertFindFirst).toHaveBeenCalledWith({
      where: {
        id: ALERT_ID,
        userId: USER_ID,
        hostel: { is: { status: "ACTIVE" } },
      },
      select: { hostel: { select: { status: true } } },
    });
    expect(mocks.alertUpdateMany).not.toHaveBeenCalled();
  });

  it("does not reveal another student's alert when deleting by ID", async () => {
    mocks.alertFindFirst.mockResolvedValueOnce(null);

    const response = await DELETE(
      new NextRequest(`https://hostello.test/api/price-alerts/${ALERT_ID}`, { method: "DELETE" }),
      CONTEXT,
    );

    expect(response.status).toBe(404);
    expect(mocks.alertFindFirst).toHaveBeenCalledWith({
      where: { id: ALERT_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(mocks.alertDeleteMany).not.toHaveBeenCalled();
  });

});
