import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/email/unsubscribe/route";
import { db } from "@/lib/db";

const SECRET = "unit-test-unsubscribe-secret";
const USER_ID = "user-1";
const EMAIL = "student@example.com";
const TOKEN = createEmailUnsubscribeToken(USER_ID, EMAIL, SECRET);

describe("/api/email/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_SECRET", SECRET);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: USER_ID,
      email: EMAIL,
    } as Awaited<ReturnType<typeof db.user.findUnique>>);
    vi.mocked(db.user.update).mockResolvedValue({
      id: USER_ID,
      emailNotifications: false,
    } as Awaited<ReturnType<typeof db.user.update>>);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("renders confirmation on GET without changing user preferences", async () => {
    const response = await GET(new NextRequest(
      `https://hostello.test/api/email/unsubscribe?token=${TOKEN}`,
    ));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Confirm unsubscribe");
    expect(html).toContain('method="post"');
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("updates the preference after a bounded signed-token confirmation POST", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/email/unsubscribe",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN, confirm: "unsubscribe" }),
      },
    ));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Unsubscribed");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { emailNotifications: false },
    });
  });

  it("does not change preferences when POST confirmation is missing", async () => {
    const response = await POST(new NextRequest(
      "https://hostello.test/api/email/unsubscribe",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN }),
      },
    ));

    expect(response.status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
