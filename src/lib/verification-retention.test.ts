import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  deletePrivate: vi.fn(),
  deleteLegacy: vi.fn(),
  userFindMany: vi.fn(),
  userUpdateMany: vi.fn(),
  jobFindMany: vi.fn(),
  notify: vi.fn(),
  log: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: mocks.userFindMany, updateMany: mocks.userUpdateMany },
    accountDeletionJob: { findMany: mocks.jobFindMany },
  },
}));
vi.mock("@/lib/notifications", () => ({ createNotification: mocks.notify }));
vi.mock("@/lib/operational-logger", () => ({ logOperationalEvent: mocks.log }));
vi.mock("@/lib/legacy-verification-docs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/legacy-verification-docs")>()),
  deleteLegacyPublicVerificationDocument: mocks.deleteLegacy,
}));
vi.mock("@/lib/verification-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/verification-storage")>()),
  listVerificationDocuments: mocks.list,
  deleteVerificationDocument: mocks.deletePrivate,
}));

import {
  MAX_ORPHAN_DELETES_PER_RUN,
  ORPHAN_GRACE_MS,
  PENDING_VERIFICATION_RETENTION_MS,
  expireStalePendingVerifications,
  selectOrphanKeys,
  sweepOrphanedVerificationDocuments,
} from "@/lib/verification-retention";

const NOW = Date.parse("2026-11-14T00:00:00Z");
const hex = (n: number) => n.toString(16).padStart(32, "0");
const key = (user: string, n: number) => `student-verifications/${user}/${hex(n)}.jpg`;
const doc = (k: string, ageMs: number) => ({ key: k, lastModified: new Date(NOW - ageMs) });
const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc.r2.dev");
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.userFindMany.mockResolvedValue([]);
  mocks.jobFindMany.mockResolvedValue([]);
  mocks.deletePrivate.mockResolvedValue(undefined);
  mocks.deleteLegacy.mockResolvedValue(true);
  mocks.userUpdateMany.mockResolvedValue({ count: 1 });
  mocks.notify.mockResolvedValue(undefined);
});

describe("selectOrphanKeys", () => {
  it("returns unreferenced documents that are past the grace period", () => {
    const docs = [doc(key("u1", 1), 2 * DAY), doc(key("u2", 2), 3 * DAY)];
    expect(selectOrphanKeys(docs, new Set([key("u1", 1)]), NOW).orphans).toEqual([key("u2", 2)]);
  });

  it("never touches a document younger than the grace period, even if unreferenced", () => {
    const docs = [doc(key("u1", 1), ORPHAN_GRACE_MS - 1000)];
    expect(selectOrphanKeys(docs, new Set(), NOW)).toEqual({ orphans: [], candidates: 0 });
  });

  it("caps how many it deletes in one run", () => {
    const docs = Array.from({ length: MAX_ORPHAN_DELETES_PER_RUN + 20 }, (_, i) => doc(key("u", i), 3 * DAY));
    const referenced = new Set(docs.slice(0, MAX_ORPHAN_DELETES_PER_RUN * 2).filter((_, i) => i % 3 !== 0).map((d) => d.key));
    expect(selectOrphanKeys(docs, referenced, NOW).orphans.length).toBeLessThanOrEqual(MAX_ORPHAN_DELETES_PER_RUN);
  });

  it("refuses to proceed when most of the bucket looks unreferenced (wrong database?)", () => {
    const docs = Array.from({ length: 20 }, (_, i) => doc(key("u", i), 3 * DAY));
    expect(() => selectOrphanKeys(docs, new Set(), NOW)).toThrow(/same environment/);
  });

  it("allows a small bucket to have a few orphans", () => {
    const docs = [doc(key("u1", 1), 3 * DAY), doc(key("u2", 2), 3 * DAY)];
    expect(selectOrphanKeys(docs, new Set(), NOW).orphans).toHaveLength(2);
  });
});

describe("sweepOrphanedVerificationDocuments", () => {
  it("deletes only unreferenced documents and counts them", async () => {
    const docs = [doc(key("u1", 1), 3 * DAY), doc(key("u2", 2), 3 * DAY), doc(key("u3", 3), 3 * DAY), doc(key("u4", 4), 3 * DAY)];
    mocks.list.mockResolvedValue(docs);
    mocks.userFindMany.mockResolvedValue([{ verificationDocUrl: key("u1", 1) }, { verificationDocUrl: key("u2", 2) }]);
    mocks.jobFindMany.mockResolvedValue([{ verificationObjectKey: key("u3", 3) }]);

    expect(await sweepOrphanedVerificationDocuments(NOW)).toBe(1);
    expect(mocks.deletePrivate).toHaveBeenCalledTimes(1);
    expect(mocks.deletePrivate).toHaveBeenCalledWith(key("u4", 4));
  });

  it("does nothing for an empty bucket", async () => {
    mocks.list.mockResolvedValue([]);
    expect(await sweepOrphanedVerificationDocuments(NOW)).toBe(0);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("deletes nothing when the safety check trips", async () => {
    mocks.list.mockResolvedValue(Array.from({ length: 12 }, (_, i) => doc(key("u", i), 3 * DAY)));
    await expect(sweepOrphanedVerificationDocuments(NOW)).rejects.toThrow();
    expect(mocks.deletePrivate).not.toHaveBeenCalled();
  });
});

describe("expireStalePendingVerifications", () => {
  const submittedAt = new Date(NOW - PENDING_VERIFICATION_RETENTION_MS - DAY);
  const privateKey = key("u1", 1);
  const legacyUrl = "https://pub-abc.r2.dev/hostels/1700000000-deadbeef-id.jpg";

  it("queries only pending student requests older than the retention period", async () => {
    mocks.userFindMany.mockResolvedValue([]);
    await expireStalePendingVerifications(NOW);

    const where = mocks.userFindMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ role: "STUDENT", verificationStatus: "PENDING" });
    expect(where.verificationSubmittedAt.lt.getTime()).toBe(NOW - PENDING_VERIFICATION_RETENTION_MS);
  });

  it("deletes the file, resets the request and tells the student", async () => {
    mocks.userFindMany.mockResolvedValue([{ id: "u1", verificationDocUrl: privateKey, verificationSubmittedAt: submittedAt }]);

    expect(await expireStalePendingVerifications(NOW)).toBe(1);

    expect(mocks.deletePrivate).toHaveBeenCalledWith(privateKey);
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: "u1", verificationStatus: "PENDING", verificationSubmittedAt: submittedAt },
      data: { verificationStatus: "NONE", verificationDocUrl: null, verificationSubmittedAt: null },
    });
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", title: "Verification request expired" }));
  });

  it("uses the public-bucket delete for a legacy document", async () => {
    mocks.userFindMany.mockResolvedValue([{ id: "u1", verificationDocUrl: legacyUrl, verificationSubmittedAt: submittedAt }]);
    await expireStalePendingVerifications(NOW);
    expect(mocks.deleteLegacy).toHaveBeenCalledWith(legacyUrl);
    expect(mocks.deletePrivate).not.toHaveBeenCalled();
  });

  it("leaves the request untouched, to retry next run, when the file cannot be deleted", async () => {
    mocks.userFindMany.mockResolvedValue([{ id: "u1", verificationDocUrl: privateKey, verificationSubmittedAt: submittedAt }]);
    mocks.deletePrivate.mockRejectedValue(new Error("r2 down"));

    expect(await expireStalePendingVerifications(NOW)).toBe(0);
    expect(mocks.userUpdateMany).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("does not notify or count a student who re-submitted while the run was in progress", async () => {
    mocks.userFindMany.mockResolvedValue([{ id: "u1", verificationDocUrl: privateKey, verificationSubmittedAt: submittedAt }]);
    mocks.userUpdateMany.mockResolvedValue({ count: 0 });

    expect(await expireStalePendingVerifications(NOW)).toBe(0);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("keeps going when one student fails", async () => {
    mocks.userFindMany.mockResolvedValue([
      { id: "u1", verificationDocUrl: privateKey, verificationSubmittedAt: submittedAt },
      { id: "u2", verificationDocUrl: key("u2", 2), verificationSubmittedAt: submittedAt },
    ]);
    mocks.deletePrivate.mockRejectedValueOnce(new Error("r2 hiccup")).mockResolvedValue(undefined);

    expect(await expireStalePendingVerifications(NOW)).toBe(1);
  });
});
