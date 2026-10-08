import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: { setTag: typeof vi.fn; setExtra: typeof vi.fn }) => void) =>
    callback({ setTag: vi.fn(), setExtra: vi.fn() }),
  ),
  cronLogUpsert: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: mocks.addBreadcrumb,
  captureException: mocks.captureException,
  withScope: mocks.withScope,
}));
vi.mock("@/lib/db", () => ({ db: { cronLog: { upsert: mocks.cronLogUpsert } } }));

import { runCronJob } from "@/lib/cron-utils";

describe("runCronJob failure handling", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cronLogUpsert.mockResolvedValue({});
  });

  afterEach(() => {
    consoleError.mockClear();
  });

  it("redacts exception text in the HTTP response, structured log, and persisted cron status", async () => {
    const secretError = new Error("postgres://user:password@private-db/hostello");
    Object.assign(secretError, { code: "P1001" });

    const response = await runCronJob("check-price-alerts", async () => {
      throw secretError;
    });
    const body = await response.json();
    const log = JSON.parse(String(consoleError.mock.calls[0][0]));

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Cron job failed", cron: "check-price-alerts" });
    expect(JSON.stringify(body)).not.toContain("private-db");
    expect(log).toMatchObject({
      event: "cron.error",
      request_id: expect.any(String),
      attributes: {
        cron: "check-price-alerts",
        error_name: "Error",
        error_code: "P1001",
      },
    });
    expect(JSON.stringify(log)).not.toContain("private-db");
    expect(mocks.cronLogUpsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ error: "Cron job failed" }),
      create: expect.objectContaining({ error: "Cron job failed" }),
    }));
    expect(mocks.captureException).toHaveBeenCalledWith(secretError);
  });

  it("waits for the CronLog write before returning success", async () => {
    let finishWrite!: (value: unknown) => void;
    const pendingWrite = new Promise((resolve) => { finishWrite = resolve; });
    mocks.cronLogUpsert.mockReturnValue(pendingWrite);
    let settled = false;
    const responsePromise = runCronJob("mark-completed-stays", async () => ({ message: "done" }))
      .then((response) => {
        settled = true;
        return response;
      });

    await vi.waitFor(() => expect(mocks.cronLogUpsert).toHaveBeenCalled());
    expect(settled).toBe(false);

    finishWrite({});
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(settled).toBe(true);
  });

  it("keeps the cron result while safely reporting CronLog write failures", async () => {
    mocks.cronLogUpsert.mockRejectedValue(new Error("postgres://user:secret@private-db/hostello"));

    const response = await runCronJob("cleanup-tokens", async () => ({ message: "cleaned" }));
    const body = await response.json();
    const persistenceLog = consoleError.mock.calls
      .map(([value]) => String(value))
      .find((value) => value.includes("cron.health_log_failure"));

    expect(response.status).toBe(200);
    expect(body.message).toBe("cleaned");
    expect(persistenceLog).toBeDefined();
    expect(persistenceLog).not.toContain("private-db");
  });

  it("keeps a supplied request and trace ID on cron outcome events", async () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const logContext = {
      request_id: "cron-request-1",
      trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
    };

    await runCronJob("cleanup-tokens", async () => ({ message: "cleaned", count: 2 }), logContext);
    const log = JSON.parse(String(consoleInfo.mock.calls[0][0]));

    expect(log).toMatchObject({
      event: "cron.success",
      request_id: "cron-request-1",
      trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
      attributes: { cron: "cleanup-tokens", count: 2 },
    });
    consoleInfo.mockRestore();
  });
});
