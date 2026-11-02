import { describe, expect, it } from "vitest";
import {
  allChecksDone,
  buildModerationBody,
  moderationSuccessMessage,
  parseAdminListingDetail,
  parseAdminListingStats,
  parseAdminListingsPage,
  readAdminError,
  validateSuspendReason,
  validateVerifyNotes,
} from "./adminListings";

const apiListing = {
  id: "h1",
  name: "Green Hostel",
  slug: "green-hostel",
  status: "PENDING_REVIEW",
  city: "Lahore",
  verified: false,
  createdAt: "2026-10-20T09:00:00.000Z",
  description: "Near campus.",
  images: ["https://images.unsplash.com/a.jpg"],
  amenities: ["wifi"],
  rules: ["No smoking"],
  completeness: 72,
  owner: { name: "Sana", email: "sana@example.com" },
};

describe("parseAdminListingsPage", () => {
  it("accepts the /api/admin/listings shape", () => {
    const parsed = parseAdminListingsPage({
      data: [apiListing],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    });
    expect(parsed?.data[0]).toMatchObject({
      id: "h1",
      status: "PENDING_REVIEW",
      completeness: 72,
      ownerName: "Sana",
      ownerEmail: "sana@example.com",
      images: ["https://images.unsplash.com/a.jpg"],
    });
  });

  it("tolerates null content arrays and description", () => {
    const parsed = parseAdminListingsPage({
      data: [{ ...apiListing, images: null, amenities: null, rules: null, description: null }],
      total: 1,
      page: 1,
      hasMore: false,
    });
    expect(parsed?.data[0].images).toEqual([]);
    expect(parsed?.data[0].description).toBe("");
  });

  it("rejects unexpected shapes and statuses", () => {
    expect(parseAdminListingsPage(null)).toBeNull();
    expect(
      parseAdminListingsPage({
        data: [{ ...apiListing, status: "DRAFT" }],
        total: 1,
        page: 1,
        hasMore: false,
      }),
    ).toBeNull();
  });
});

describe("parseAdminListingStats", () => {
  it("reads the stats payload", () => {
    const stats = parseAdminListingStats({
      data: {
        totalListings: 30,
        pendingApproval: 4,
        flaggedCount: 1,
        newlyPublished: 3,
        newlyPublishedWindowDays: 7,
        flaggedThreshold: 50,
      },
    });
    expect(stats?.pendingApproval).toBe(4);
    expect(parseAdminListingStats({ data: { totalListings: 1 } })).toBeNull();
  });
});

describe("parseAdminListingDetail", () => {
  it("reads address, rooms and owner history", () => {
    const detail = parseAdminListingDetail({
      data: {
        area: "Johar Town",
        address: "12 Canal Road",
        gender: "FEMALE",
        pricePerMonth: 15000,
        capacity: 20,
        owner: {
          name: "Sana",
          email: "sana@example.com",
          createdAt: "2026-01-01T00:00:00.000Z",
          _count: { hostels: 2 },
        },
        rooms_rel: [
          { id: "r1", name: "Double", pricePerMonth: 15000, capacity: 2 },
          { id: 5 },
        ],
      },
    });
    expect(detail?.address).toBe("12 Canal Road");
    expect(detail?.rooms).toHaveLength(1);
    expect(detail?.ownerListingCount).toBe(2);
    expect(parseAdminListingDetail({ data: {} })).toBeNull();
  });
});

describe("moderation helpers", () => {
  const checks = {
    ownerAuthorityChecked: true,
    locationChecked: true,
    listingDetailsChecked: true,
    photosChecked: true,
  };

  it("requires every verification check", () => {
    expect(allChecksDone(checks)).toBe(true);
    expect(allChecksDone({ ...checks, photosChecked: false })).toBe(false);
  });

  it("builds the verify body with trimmed notes, omitting empty ones", () => {
    expect(buildModerationBody("h1", "verify", { checks, notes: "  ok  " })).toEqual({
      hostelId: "h1",
      action: "verify",
      verification: { ...checks, notes: "ok" },
    });
    expect(buildModerationBody("h1", "verify", { checks, notes: "  " })).toEqual({
      hostelId: "h1",
      action: "verify",
      verification: checks,
    });
  });

  it("sends a reason only when suspending", () => {
    expect(buildModerationBody("h1", "suspend", { reason: " Fake photos " })).toEqual({
      hostelId: "h1",
      action: "suspend",
      reason: "Fake photos",
    });
    expect(buildModerationBody("h1", "suspend", { reason: "" })).toEqual({
      hostelId: "h1",
      action: "suspend",
    });
    expect(buildModerationBody("h1", "activate", { reason: "ignored" })).toEqual({
      hostelId: "h1",
      action: "activate",
    });
  });

  it("enforces the API's length limits", () => {
    expect(validateSuspendReason("x".repeat(500))).toBeNull();
    expect(validateSuspendReason("x".repeat(501))).toContain("500");
    expect(validateVerifyNotes("x".repeat(2000))).toBeNull();
    expect(validateVerifyNotes("x".repeat(2001))).toContain("2000");
  });

  it("describes what happened", () => {
    expect(moderationSuccessMessage("verify", "Green")).toContain("verified and live");
    expect(moderationSuccessMessage("suspend", "Green")).toContain("suspended");
    expect(moderationSuccessMessage("activate", "Green")).toContain("live again");
  });

  it("reads API errors", () => {
    expect(readAdminError({ error: "Forbidden" }, "x")).toBe("Forbidden");
    expect(readAdminError(null, "fallback")).toBe("fallback");
  });
});
