import { describe, expect, it } from "vitest";
import {
  deletePostMessage,
  hasMoreReportedPosts,
  isHiddenFromStudents,
  isPostExpired,
  parseReportedRoommatePostsPage,
} from "./adminRoommateReports";

const report = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  reason: "Asked me to pay outside the platform",
  createdAt: "2026-11-01T10:00:00.000Z",
  reporter: { id: "u2", name: "Sara" },
  ...overrides,
});

const post = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  bio: "Final year student looking for a quiet roommate.",
  budget: 15000,
  moveIn: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-10-28T09:00:00.000Z",
  expiresAt: "2026-11-28T09:00:00.000Z",
  hostel: { id: "h1", name: "Green Hostel", slug: "green-hostel" },
  user: { id: "u1", name: "Ayesha" },
  reports: [report()],
  _count: { reports: 1 },
  ...overrides,
});

const envelope = (data: unknown[], overrides: Record<string, unknown> = {}) => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  hideThreshold: 3,
  ...overrides,
});

describe("parseReportedRoommatePostsPage", () => {
  it("maps API rows into the moderation shape", () => {
    expect(parseReportedRoommatePostsPage(envelope([post()]))).toEqual({
      data: [
        {
          id: "p1",
          bio: "Final year student looking for a quiet roommate.",
          budget: 15000,
          moveIn: "2026-12-01T00:00:00.000Z",
          createdAt: "2026-10-28T09:00:00.000Z",
          expiresAt: "2026-11-28T09:00:00.000Z",
          hostelName: "Green Hostel",
          hostelSlug: "green-hostel",
          authorName: "Ayesha",
          reports: [
            {
              id: "r1",
              reason: "Asked me to pay outside the platform",
              createdAt: "2026-11-01T10:00:00.000Z",
              reporterName: "Sara",
            },
          ],
          reportCount: 1,
        },
      ],
      total: 1,
      page: 1,
      hideThreshold: 3,
    });
  });

  it("keeps the full report count when only the latest reports are returned", () => {
    const parsed = parseReportedRoommatePostsPage(
      envelope([post({ _count: { reports: 63 } })]),
    );
    expect(parsed?.data[0].reports).toHaveLength(1);
    expect(parsed?.data[0].reportCount).toBe(63);
  });

  it("falls back to the number of reports when the count is missing", () => {
    const parsed = parseReportedRoommatePostsPage(
      envelope([post({ _count: undefined })]),
    );
    expect(parsed?.data[0].reportCount).toBe(1);
  });

  it("tolerates a missing budget, move-in date and reporter name", () => {
    const parsed = parseReportedRoommatePostsPage(
      envelope([
        post({
          budget: null,
          moveIn: null,
          reports: [report({ reporter: null })],
        }),
      ]),
    );
    expect(parsed?.data[0]).toMatchObject({ budget: null, moveIn: null });
    expect(parsed?.data[0].reports[0].reporterName).toBe("A student");
  });

  it("rejects unexpected shapes", () => {
    expect(parseReportedRoommatePostsPage(null)).toBeNull();
    expect(parseReportedRoommatePostsPage({ data: [] })).toBeNull();
    expect(parseReportedRoommatePostsPage(envelope([{ id: "p1" }]))).toBeNull();
    expect(
      parseReportedRoommatePostsPage(envelope([post({ reports: [{ id: 4 }] })])),
    ).toBeNull();
    expect(
      parseReportedRoommatePostsPage(envelope([post({ hostel: null })])),
    ).toBeNull();
  });
});

describe("hasMoreReportedPosts", () => {
  it("is true only while more rows remain beyond the loaded pages", () => {
    expect(hasMoreReportedPosts(1, 20, 45)).toBe(true);
    expect(hasMoreReportedPosts(2, 20, 45)).toBe(true);
    expect(hasMoreReportedPosts(3, 20, 45)).toBe(false);
    expect(hasMoreReportedPosts(1, 20, 20)).toBe(false);
    expect(hasMoreReportedPosts(1, 20, 0)).toBe(false);
  });
});

describe("isHiddenFromStudents", () => {
  it("hides a post at the threshold, not before", () => {
    expect(isHiddenFromStudents(2, 3)).toBe(false);
    expect(isHiddenFromStudents(3, 3)).toBe(true);
    expect(isHiddenFromStudents(10, 3)).toBe(true);
  });
});

describe("isPostExpired", () => {
  const expiresAt = "2026-11-28T09:00:00.000Z";

  it("is expired only after the expiry time", () => {
    expect(isPostExpired(expiresAt, Date.parse("2026-11-28T08:59:59.000Z"))).toBe(false);
    expect(isPostExpired(expiresAt, Date.parse("2026-11-28T09:00:01.000Z"))).toBe(true);
  });
});

describe("deletePostMessage", () => {
  it("names the author and the hostel", () => {
    expect(deletePostMessage("Ayesha", "Green Hostel")).toBe(
      "Ayesha's post on Green Hostel was deleted.",
    );
  });
});
