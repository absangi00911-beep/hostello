import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { priceAlert: { findMany: vi.fn(), updateMany: vi.fn() } },
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email-templates/price-alert", () => ({
  priceAlertEmail: vi.fn(() => ({ subject: "Price drop", html: "<p>Price drop</p>" })),
}));
vi.mock("@/lib/email-unsubscribe-token", () => ({
  createEmailUnsubscribeToken: vi.fn(() => "signed-preferences-token"),
}));
vi.mock("@/lib/safe-error", () => ({ getSafeErrorSummary: () => ({ name: "Error" }) }));

import { checkPriceAlerts } from "@/lib/price-alerts";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { priceAlertEmail } from "@/lib/email-templates/price-alert";
import { createEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token";

const alert = {
  id: "alert-1",
  targetPrice: 18_000,
  lastKnownPrice: 20_000,
  unsubscribeToken: "alert-token",
  user: {
    id: "user-1",
    email: "student@example.com",
    name: "Ayesha",
    emailNotifications: true,
  },
  hostel: {
    id: "hostel-1",
    name: "Garden Hostel",
    slug: "garden-hostel",
    pricePerMonth: 15_000,
  },
};

describe("checkPriceAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_SECRET", "test-email-preference-secret");
    vi.mocked(db.priceAlert.findMany).mockReset().mockResolvedValue([]);
    vi.mocked(db.priceAlert.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof sendEmail>>);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("deactivates only after successful delivery and includes both unsubscribe choices", async () => {
    vi.mocked(db.priceAlert.findMany)
      .mockResolvedValueOnce([alert] as Awaited<ReturnType<typeof db.priceAlert.findMany>>);

    const result = await checkPriceAlerts("https://hostello.test/");

    expect(result).toMatchObject({ success: true, emailsSent: 1, alertsChecked: 1, failed: 0 });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "student@example.com" }));
    expect(createEmailUnsubscribeToken).toHaveBeenCalledWith(
      "user-1",
      "student@example.com",
      "test-email-preference-secret",
    );
    expect(priceAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
      unsubscribeUrl: "https://hostello.test/api/alerts/unsubscribe?token=alert-token",
      emailPreferencesUrl: "https://hostello.test/api/email/unsubscribe?token=signed-preferences-token",
    }));
    expect(db.priceAlert.updateMany).toHaveBeenCalledWith({
      where: { id: "alert-1", active: true },
      data: { active: false, lastAlertAt: expect.any(Date), lastKnownPrice: 15_000 },
    });
    expect(db.priceAlert.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true, hostel: { is: { status: "ACTIVE" } } },
      take: 100,
    }));
  });

  it("retains the active alert and prior price when email delivery fails", async () => {
    vi.mocked(db.priceAlert.findMany)
      .mockResolvedValueOnce([alert] as Awaited<ReturnType<typeof db.priceAlert.findMany>>);
    vi.mocked(sendEmail).mockResolvedValue({
      success: false,
      error: "provider unavailable",
    } as Awaited<ReturnType<typeof sendEmail>>);

    const result = await checkPriceAlerts();

    expect(result).toMatchObject({ emailsSent: 0, failed: 1 });
    expect(db.priceAlert.updateMany).not.toHaveBeenCalled();
  });

  it("suppresses optional alert emails when the account preference is off", async () => {
    vi.mocked(db.priceAlert.findMany)
      .mockResolvedValueOnce([{
        ...alert,
        user: { ...alert.user, emailNotifications: false },
      }] as Awaited<ReturnType<typeof db.priceAlert.findMany>>);

    const result = await checkPriceAlerts();

    expect(result).toMatchObject({ emailsSent: 0, skipped: 1 });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(db.priceAlert.updateMany).toHaveBeenCalledWith({
      where: { id: "alert-1", active: true },
      data: { lastKnownPrice: 15_000 },
    });
  });
});
