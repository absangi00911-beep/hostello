import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { HostelInquiryForm } from "./HostelInquiryForm";
import { getSafeLoginCallbackUrl } from "@/lib/auth/safe-login-callback";
import {
  PENDING_INQUIRY_STORAGE_KEY,
  submitHostelInquiry,
} from "@/lib/hostel-inquiry";

const inquiry = {
  hostelId: "hostel-1",
  hostelName: "Canal View Hostel",
  message: "Could I move in next month?",
};

describe("HostelInquiryForm", () => {
  it("provides an accessible message field", () => {
    const markup = renderToStaticMarkup(
      <HostelInquiryForm
        hostelId="hostel-1"
        hostelName="Canal View Hostel"
        isSignedInStudent
      />,
    );

    expect(markup).toContain('for="hostel-inquiry-message"');
    expect(markup).toContain('name="message"');
    expect(markup).toContain("Message the host");
  });

  it("accepts only the approved internal inquiry callback", () => {
    expect(getSafeLoginCallbackUrl("/messages?pendingInquiry=1")).toBe(
      "/messages?pendingInquiry=1",
    );
    expect(getSafeLoginCallbackUrl("//attacker.example")).toBe("/");
    expect(getSafeLoginCallbackUrl("https://attacker.example/messages")).toBe(
      "/",
    );
    expect(getSafeLoginCallbackUrl("/login?callbackUrl=/messages")).toBe("/");
  });

  it("posts a signed-in inquiry and returns only the conversation destination", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "conversation-42" } }),
    });
    const storage = { setItem: vi.fn() };

    const outcome = await submitHostelInquiry({
      ...inquiry,
      isSignedInStudent: true,
      storage,
      request,
    });

    expect(request).toHaveBeenCalledWith("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostelId: inquiry.hostelId,
        initialMessage: inquiry.message,
      }),
    });
    expect(outcome).toEqual({
      destination: "/messages?conversationId=conversation-42",
    });
    expect("destination" in outcome ? outcome.destination : "").not.toContain(
      inquiry.message,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("stores the exact signed-out draft and returns the inquiry login destination", async () => {
    const storage = { setItem: vi.fn() };
    const request = vi.fn();

    const outcome = await submitHostelInquiry({
      ...inquiry,
      isSignedInStudent: false,
      storage,
      request,
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      PENDING_INQUIRY_STORAGE_KEY,
      JSON.stringify(inquiry),
    );
    expect(outcome).toEqual({
      destination: "/login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1",
    });
    expect("destination" in outcome ? outcome.destination : "").not.toContain(
      inquiry.message,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("does not return a destination when saving the signed-out draft fails", async () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error("Storage is unavailable");
      }),
    };
    const request = vi.fn();

    const outcome = await submitHostelInquiry({
      ...inquiry,
      isSignedInStudent: false,
      storage,
      request,
    });

    expect(outcome).toEqual({ error: "storage" });
    expect(request).not.toHaveBeenCalled();
  });

  it("does not navigate when delivery fails or the API omits a conversation id", async () => {
    const storage = { setItem: vi.fn() };
    const request = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Denied" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

    await expect(
      submitHostelInquiry({
        ...inquiry,
        isSignedInStudent: true,
        storage,
        request,
      }),
    ).resolves.toEqual({ error: "delivery" });
    await expect(
      submitHostelInquiry({
        ...inquiry,
        isSignedInStudent: true,
        storage,
        request,
      }),
    ).resolves.toEqual({ error: "delivery" });
  });
});
