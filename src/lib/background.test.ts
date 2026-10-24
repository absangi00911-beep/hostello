import { beforeEach, describe, expect, it, vi } from "vitest";

const afterMock = vi.hoisted(() => vi.fn());
const logMock = vi.hoisted(() => vi.fn());

vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/operational-logger", () => ({ logOperationalEvent: logMock }));

import { runAfterResponse } from "./background";

describe("runAfterResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defers the task to after() and does not run it immediately", async () => {
    let registered: (() => Promise<void>) | undefined;
    afterMock.mockImplementation((fn: () => Promise<void>) => {
      registered = fn;
    });
    const task = vi.fn().mockResolvedValue(undefined);

    await runAfterResponse("email.status", task);

    expect(task).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledOnce();

    await registered!();
    expect(task).toHaveBeenCalledOnce();
  });

  it("logs a failure from a deferred task instead of throwing", async () => {
    let registered: (() => Promise<void>) | undefined;
    afterMock.mockImplementation((fn: () => Promise<void>) => {
      registered = fn;
    });

    await runAfterResponse("email.status", () => Promise.reject(new Error("provider down")));

    await expect(registered!()).resolves.toBeUndefined();
    expect(logMock).toHaveBeenCalledWith(
      "error",
      "email.status.failed",
      expect.objectContaining({ error_name: "Error" }),
      undefined,
    );
  });

  it("runs the task immediately when there is no request scope", async () => {
    afterMock.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope");
    });
    const task = vi.fn().mockResolvedValue(undefined);

    await runAfterResponse("email.status", task);

    expect(task).toHaveBeenCalledOnce();
  });

  it("still swallows and logs failures when it has to run immediately", async () => {
    afterMock.mockImplementation(() => {
      throw new Error("outside request scope");
    });

    await expect(
      runAfterResponse("search.index", () => Promise.reject(new Error("typesense down"))),
    ).resolves.toBeUndefined();
    expect(logMock).toHaveBeenCalledWith("error", "search.index.failed", expect.any(Object), undefined);
  });

  it("passes the request log context through", async () => {
    afterMock.mockImplementation(() => {
      throw new Error("outside request scope");
    });
    const context = { request_id: "req-1" } as never;

    await runAfterResponse("email.status", () => Promise.reject(new Error("x")), context);

    expect(logMock).toHaveBeenCalledWith("error", "email.status.failed", expect.any(Object), context);
  });
});
