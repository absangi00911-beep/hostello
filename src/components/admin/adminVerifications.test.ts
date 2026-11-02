import { describe, expect, it } from "vitest";
import {
  buildVerificationDecisionBody,
  isImageContentType,
  parseAdminVerificationsPage,
  verificationDecisionMessage,
} from "./adminVerifications";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  city: "Lahore",
  verificationDocUrl: "/api/admin/verifications/u1/document",
  verificationDocContentType: "image/jpeg",
  verificationSubmittedAt: "2026-10-30T08:00:00.000Z",
  _count: { bookings: 2 },
  ...overrides,
});

const envelope = (data: unknown[], overrides: Record<string, unknown> = {}) => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  hasMore: false,
  ...overrides,
});

describe("parseAdminVerificationsPage", () => {
  it("maps API rows into the queue shape", () => {
    expect(parseAdminVerificationsPage(envelope([row()]))).toEqual({
      data: [
        {
          id: "u1",
          name: "Ayesha Khan",
          email: "ayesha@example.com",
          city: "Lahore",
          documentUrl: "/api/admin/verifications/u1/document",
          documentContentType: "image/jpeg",
          submittedAt: "2026-10-30T08:00:00.000Z",
          bookingCount: 2,
        },
      ],
      total: 1,
      page: 1,
      hasMore: false,
    });
  });

  it("tolerates missing optional fields", () => {
    const parsed = parseAdminVerificationsPage(
      envelope([
        row({
          city: null,
          verificationDocUrl: null,
          verificationDocContentType: null,
          verificationSubmittedAt: null,
          _count: undefined,
        }),
      ]),
    );
    expect(parsed?.data[0]).toMatchObject({
      city: null,
      documentUrl: null,
      documentContentType: null,
      submittedAt: null,
      bookingCount: 0,
    });
  });

  it("rejects unexpected shapes", () => {
    expect(parseAdminVerificationsPage(null)).toBeNull();
    expect(parseAdminVerificationsPage({ data: [] })).toBeNull();
    expect(parseAdminVerificationsPage(envelope([{ id: "u1" }]))).toBeNull();
    expect(
      parseAdminVerificationsPage(envelope([row({ name: 4 })])),
    ).toBeNull();
  });

  it("ignores an unparseable submission date", () => {
    const parsed = parseAdminVerificationsPage(
      envelope([row({ verificationSubmittedAt: "not-a-date" })]),
    );
    expect(parsed?.data[0].submittedAt).toBeNull();
  });
});

describe("isImageContentType", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("previews %s", (type) => {
    expect(isImageContentType(type)).toBe(true);
  });

  it("does not preview PDFs or unknown types", () => {
    expect(isImageContentType("application/pdf")).toBe(false);
    expect(isImageContentType(null)).toBe(false);
  });
});

describe("buildVerificationDecisionBody", () => {
  it("sends only the user and the action", () => {
    expect(buildVerificationDecisionBody("u1", "approve")).toEqual({
      userId: "u1",
      action: "approve",
    });
    expect(buildVerificationDecisionBody("u1", "reject")).toEqual({
      userId: "u1",
      action: "reject",
    });
  });
});

describe("verificationDecisionMessage", () => {
  it("describes each outcome", () => {
    expect(verificationDecisionMessage("approve", "Ayesha")).toContain(
      "verified student",
    );
    expect(verificationDecisionMessage("reject", "Ayesha")).toContain(
      "can submit a new document",
    );
  });
});
