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
});
