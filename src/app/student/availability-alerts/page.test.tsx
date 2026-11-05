import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import AvailabilityAlertsRoute from "@/app/student/availability-alerts/page";

describe("AvailabilityAlertsRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("preserves canonical alert criteria through sign-in", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(
      AvailabilityAlertsRoute({
        searchParams: Promise.resolve({
          type: "SEARCH",
          city: "Lahore",
          sort: "price_asc",
          page: "4",
          limit: "2",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fstudent%2Favailability-alerts%3Ftype%3DSEARCH%26city%3DLahore",
    );
  });

  it("renders alert management for students and ignores unsupported result controls", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "student-1",
        role: "STUDENT",
        name: "Student",
        email: "student@example.test",
        image: null,
      },
    });

    const markup = renderToStaticMarkup(
      await AvailabilityAlertsRoute({
        searchParams: Promise.resolve({
          type: "SEARCH",
          city: "Lahore",
          sort: "price_asc",
          page: "4",
        }),
      }),
    );

    expect(markup).toContain("Availability alerts");
    expect(markup).toContain("Lahore");
    expect(markup).not.toContain("price_asc");
  });

  it("does not render alert management for non-students", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "owner-1",
        role: "OWNER",
        name: "Owner",
        email: "owner@example.test",
        image: null,
      },
    });

    await expect(
      AvailabilityAlertsRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
