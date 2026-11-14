import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const job = {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const user = { updateMany: vi.fn() };
  return {
    job,
    user,
    deletePrivate: vi.fn(),
    deleteLegacy: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    accountDeletionJob: mocks.job,
    user: mocks.user,
    $transaction: (callback: (tx: unknown) => unknown) =>
      callback({ accountDeletionJob: mocks.job, user: mocks.user }),
  },
}));
vi.mock("@/lib/payouts", () => ({ getEligiblePayoutBookingWhere: vi.fn() }));
vi.mock("@/lib/typesense-sync", () => ({ removeHostelIndex: vi.fn() }));
vi.mock("@/lib/availability-alerts", () => ({ reevaluateAvailabilityAlertsForHostel: vi.fn() }));
vi.mock("@/lib/room-availability-service", () => ({ lockAvailabilityInventory: vi.fn() }));
vi.mock("@/lib/legacy-verification-docs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/legacy-verification-docs")>()),
  deleteLegacyPublicVerificationDocument: mocks.deleteLegacy,
}));
vi.mock("@/lib/verification-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/verification-storage")>()),
  deleteVerificationDocument: mocks.deletePrivate,
}));

import { processAccountDeletionQueue } from "@/lib/account-deletion";

const LEGACY_URL = "https://pub-abc.r2.dev/hostels/1700000000-deadbeef-student_id.jpg";
const PRIVATE_KEY = `student-verifications/u1/${"a".repeat(32)}.jpg`;

function jobAtDocumentPhase(verificationObjectKey: string | null) {
  mocks.job.findUnique.mockResolvedValue({
    id: "job1",
    userId: "u1",
    phase: "PRIVATE_DOCUMENT",
    status: "PROCESSING",
    verificationObjectKey,
  });
}

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc.r2.dev");
  for (const fn of [...Object.values(mocks.job), ...Object.values(mocks.user), mocks.deletePrivate, mocks.deleteLegacy]) {
    fn.mockReset();
  }
  mocks.job.findMany.mockResolvedValueOnce([{ id: "job1" }]).mockResolvedValue([]);
  mocks.job.updateMany.mockResolvedValue({ count: 1 });
  mocks.job.update.mockResolvedValue({});
  mocks.user.updateMany.mockResolvedValue({ count: 1 });
  mocks.deletePrivate.mockResolvedValue(undefined);
  mocks.deleteLegacy.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("account deletion: verification document phase", () => {
  it("deletes a private-bucket document with the private-storage helper", async () => {
    jobAtDocumentPhase(PRIVATE_KEY);

    await processAccountDeletionQueue();

    expect(mocks.deletePrivate).toHaveBeenCalledWith(PRIVATE_KEY);
    expect(mocks.deleteLegacy).not.toHaveBeenCalled();
    expect(mocks.job.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ verificationObjectKey: null }) }),
    );
  });

  it("deletes a legacy public-bucket document so the file does not outlive the account", async () => {
    jobAtDocumentPhase(LEGACY_URL);

    await processAccountDeletionQueue();

    expect(mocks.deleteLegacy).toHaveBeenCalledWith(LEGACY_URL);
    expect(mocks.deletePrivate).not.toHaveBeenCalled();
    expect(mocks.user.updateMany).toHaveBeenCalled();
  });

  it("keeps the job on this phase and retryable when the delete fails", async () => {
    jobAtDocumentPhase(LEGACY_URL);
    mocks.deleteLegacy.mockRejectedValue(new Error("r2 down"));

    await expect(processAccountDeletionQueue()).rejects.toThrow("r2 down");

    expect(mocks.job.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) }),
    );
    expect(mocks.job.update).not.toHaveBeenCalled();
  });

  it("skips the delete when the account had no document", async () => {
    jobAtDocumentPhase(null);

    await processAccountDeletionQueue();

    expect(mocks.deletePrivate).not.toHaveBeenCalled();
    expect(mocks.deleteLegacy).not.toHaveBeenCalled();
  });
});
