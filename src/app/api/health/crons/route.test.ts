import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cronLogFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { cronLog: { findMany: mocks.cronLogFindMany } } }));

import { GET } from "./route";

const request = () => new Request("https://hostello.test/api/health/crons");

describe("GET /api/health/crons", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    mocks.cronLogFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    consoleError.mockClear();
  });

  it("reads only the configured cron names", async () => {
    const response = await GET(request());

    expect(response.status).toBe(207);
    expect(mocks.cronLogFindMany).toHaveBeenCalledWith({
      where: {
        name: {
          in: [
            "cancel-abandoned-payments",
            "expire-unanswered-bookings",
            "check-price-alerts",
            "cleanup-tokens",
            "cleanup-verification-uploads",
            "mark-completed-stays",
            "process-account-deletions",
          ],
        },
      },
      select: { name: true, ranAt: true, status: true, durationMs: true, error: true },
    });
  });

  it("redacts raw error text retained in older cron log rows", async () => {
    mocks.cronLogFindMany.mockResolvedValue([{
      name: "check-price-alerts",
      ranAt: new Date(),
      status: "error",
      durationMs: 30,
      error: "postgres://user:password@legacy-private-db/hostello",
    }]);

    const response = await GET(request());
    const body = await response.json();
    const failedCheck = body.crons.find((cron: { name: string }) => cron.name === "check-price-alerts");

    expect(response.status).toBe(207);
    expect(failedCheck.error).toBe("Cron job failed; details redacted.");
    expect(JSON.stringify(body)).not.toContain("legacy-private-db");
  });

  it("returns a generic database error and logs only safe diagnostics", async () => {
    mocks.cronLogFindMany.mockRejectedValue(new Error("postgres://user:password@private-db/hostello"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Database unavailable" });
    expect(JSON.stringify(body)).not.toContain("private-db");
    expect(consoleError).toHaveBeenCalledWith("[GET /api/health/crons]", { name: "Error" });
  });
});
