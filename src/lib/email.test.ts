import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  // A regular function, because the code under test calls `new Resend(key)`.
  Resend: vi.fn(function () {
    return { emails: { send: sendMock } };
  }),
}));

import { sendEmail } from "./email";

const message = { to: "student@example.com", subject: "Hello", html: "<p>Hi</p>" };

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reports failure in production when the Resend key is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail(message);

    expect(result.success).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  it("reports failure in production when the key is the placeholder", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_placeholder");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail(message);

    expect(result.success).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("keeps the no-op success behavior outside production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendEmail(message);

    expect(result).toEqual({ success: true, dev: true });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends through Resend in production with a real-looking key", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_live_key_123");

    const result = await sendEmail(message);

    expect(result).toEqual({ success: true, id: "email-1" });
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("passes a stable idempotency key and does not log provider errors for outbox sends", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_sandbox_test_key");
    sendMock.mockResolvedValue({ data: null, error: { message: "provider response must not be logged" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail(message, {
      idempotencyKey: "payment-confirmation:test:owner",
      suppressErrorLogs: true,
    });

    expect(result).toEqual({ success: false, error: "Email delivery failed." });
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: message.to }), expect.objectContaining({
      idempotencyKey: "payment-confirmation:test:owner",
      signal: expect.any(AbortSignal),
    }));
    expect(log).not.toHaveBeenCalled();
  });

  it("aborts a Resend request that exceeds the provider timeout", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_live_key_123");
    sendMock.mockImplementation((_payload, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("request aborted")));
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = sendEmail(message);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toMatchObject({ success: false });
    expect(sendMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
