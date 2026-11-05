import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/availability-alerts", () => ({
  AvailabilityAlertHostelUnavailableError: class extends Error {},
  AvailabilityAlertValidationError: class extends Error {},
  deleteAvailabilityAlert: vi.fn(),
  serializeAvailabilityAlert: vi.fn((alert: { id: string }) => ({ id: alert.id })),
  updateAvailabilityAlert: vi.fn(),
}));

import { DELETE, PATCH } from "@/app/api/availability-alerts/[id]/route";
import { auth } from "@/lib/auth/config";
import { rateLimit } from "@/lib/rate-limit";
import {
  deleteAvailabilityAlert,
  updateAvailabilityAlert,
} from "@/lib/availability-alerts";

const params = Promise.resolve({ id: "alert-1" });

describe("/api/availability-alerts/:id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
      expires: "2030-01-01T00:00:00.000Z",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      ok: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
    vi.mocked(updateAvailabilityAlert).mockResolvedValue({ id: "alert-1" } as never);
    vi.mocked(deleteAvailabilityAlert).mockResolvedValue(true);
  });

  it("updates alert state only in the authenticated student's scope", async () => {
    const response = await PATCH(
      new NextRequest("https://hostello.test/api/availability-alerts/alert-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: false }),
      }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(updateAvailabilityAlert).toHaveBeenCalledWith(
      "student-1",
      "alert-1",
      { active: false, criteria: undefined },
      expect.anything(),
      expect.any(Date),
    );
  });

  it("rejects non-students before changing an alert", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
      expires: "2030-01-01T00:00:00.000Z",
    });
    const response = await DELETE(
      new NextRequest("https://hostello.test/api/availability-alerts/alert-1", {
        method: "DELETE",
      }),
      { params },
    );

    expect(response.status).toBe(403);
    expect(deleteAvailabilityAlert).not.toHaveBeenCalled();
  });

  it("returns not-found for an alert outside the student's scope", async () => {
    vi.mocked(deleteAvailabilityAlert).mockResolvedValueOnce(false);
    const response = await DELETE(
      new NextRequest("https://hostello.test/api/availability-alerts/alert-1", {
        method: "DELETE",
      }),
      { params },
    );

    expect(response.status).toBe(404);
    expect(deleteAvailabilityAlert).toHaveBeenCalledWith(
      "student-1",
      "alert-1",
      expect.anything(),
    );
  });
});
