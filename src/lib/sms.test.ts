import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSms } from "./sms";

describe("sendSms", () => {
  beforeEach(() => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC_test");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "token");
    vi.stubEnv("TWILIO_PHONE_NUMBER", "+15550001111");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("gives the Twilio request a timeout", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sid: "SM1" }) });
    vi.stubGlobal("fetch", fetchMock);

    await sendSms({ to: "+923001234567", message: "Your code is 123456" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns a failure instead of hanging or throwing when Twilio times out", async () => {
    const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendSms({ to: "+923001234567", message: "Your code is 123456" });

    expect(result.success).toBe(false);
  });

  it("fails closed in production when Twilio is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms({ to: "+923001234567", message: "Your code is 123456" });

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
