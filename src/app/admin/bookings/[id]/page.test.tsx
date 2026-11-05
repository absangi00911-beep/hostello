import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), notFound: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    mocks.notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import AdminBookingDetailRoute from "./page";

describe("AdminBookingDetailRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.notFound.mockReset();
  });

  it("rejects malformed or oversized booking IDs", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    await expect(
      AdminBookingDetailRoute({ params: Promise.resolve({ id: "x".repeat(65) }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("renders an admin detail view with async route params", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const markup = renderToStaticMarkup(
      await AdminBookingDetailRoute({
        params: Promise.resolve({ id: "booking_1" }),
      }),
    );
    expect(markup).toContain("Loading booking...");
  });

  it("hides booking details from non-admin roles", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } });
    await expect(
      AdminBookingDetailRoute({
        params: Promise.resolve({ id: "booking_1" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
