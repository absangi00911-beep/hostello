import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    priceAlert: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.20"),
  rateLimit: vi.fn(),
}));

import { GET, POST } from "@/app/api/alerts/unsubscribe/route";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const TOKEN = "clpricealert0000000000000001";
const ALERT = {
  id: "alert-1",
  active: true,
  hostel: { name: "Garden Hostel" },
};

describe("/api/alerts/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 119, resetAt: Date.now() + 60_000 });
    vi.mocked(db.priceAlert.findUnique).mockResolvedValue(
      ALERT as Awaited<ReturnType<typeof db.priceAlert.findUnique>>,
    );
    vi.mocked(db.priceAlert.updateMany).mockResolvedValue({ count: 1 });
  });

  it("shows a confirmation form on GET without changing the alert", async () => {
    const response = await GET(new NextRequest(
      `https://hostello.test/api/alerts/unsubscribe?token=${TOKEN}`,
    ));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Confirm unsubscribe");
    expect(html).toContain('method="post"');
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(db.priceAlert.updateMany).not.toHaveBeenCalled();
  });

  it("throttles public token lookups before querying the alert", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(new NextRequest(
      `https://hostello.test/api/alerts/unsubscribe?token=${TOKEN}`,
    ));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(db.priceAlert.findUnique).not.toHaveBeenCalled();
  });

  it("deactivates an alert only after the bounded confirmation POST", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/alerts/unsubscribe",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "unsubscribe" }),
      },
    ));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Unsubscribed");
    expect(db.priceAlert.updateMany).toHaveBeenCalledWith({
      where: { id: "alert-1", unsubscribeToken: TOKEN, active: true },
      data: { active: false },
    });
  });

  it("throttles confirmation POSTs before parsing or querying the alert", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await POST(new NextRequest(
      "https://hostello.test/api/alerts/unsubscribe",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "unsubscribe" }),
      },
    ));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(db.priceAlert.findUnique).not.toHaveBeenCalled();
    expect(db.priceAlert.updateMany).not.toHaveBeenCalled();
  });

  it("does not change an alert when POST confirmation is missing", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/alerts/unsubscribe",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN }),
      },
    ));

    expect(response.status).toBe(400);
    expect(db.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});
