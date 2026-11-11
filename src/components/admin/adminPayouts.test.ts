import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  canGenerateBatch,
  generateBlockedReason,
  parseAdminPayoutsPage,
  validateReference,
  validateVoidReason,
  type AdminPayoutOwner,
} from "./adminPayouts";

const apiPayout = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  amount: 42000,
  status: "PENDING",
  reference: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  paidAt: null,
  cancelledAt: null,
  cancelledBy: null,
  cancellationReason: null,
  destinationSnapshot: {
    bankAccountTitle: "Bilal Khan",
    bankAccountNumber: "PK36SCBL0000001123456702",
    bankName: "Standard Chartered",
  },
  destinationSnapshotStatus: "available",
  auditEvents: [
    {
      id: "e1",
      actorId: "a1",
      action: "BATCH_CREATED",
      amount: 42000,
      reference: null,
      reason: null,
      createdAt: "2026-11-01T10:00:00.000Z",
    },
  ],
  ...overrides,
});

const apiOwner = (overrides: Record<string, unknown> = {}) => ({
  id: "o1",
  name: "Bilal",
  email: "bilal@example.com",
  hasBankDetails: true,
  pendingBalance: 10000,
  payouts: [apiPayout()],
  payoutHistoryTruncated: false,
  ...overrides,
});

const page = (data: unknown[] = [apiOwner()]) => ({
  data,
  total: data.length,
  page: 1,
  limit: 25,
  hasMore: false,
  payoutHistoryPerOwner: 20,
});

describe("parseAdminPayoutsPage", () => {
  it("parses owners, payouts, destination and audit events", () => {
    const parsed = parseAdminPayoutsPage(page());
    expect(parsed?.total).toBe(1);
    const payout = parsed?.data[0].payouts[0];
    expect(payout?.destination?.bankName).toBe("Standard Chartered");
    expect(payout?.destinationStatus).toBe("available");
    expect(payout?.auditEvents[0].action).toBe("BATCH_CREATED");
  });

  it("parses an approved status and approval metadata", () => {
    const parsed = parseAdminPayoutsPage(page([apiOwner({
      payouts: [apiPayout({
        status: "APPROVED",
        approvedBy: "admin-2",
        approvedAt: "2026-11-02T08:00:00.000Z",
      })],
    })]));
    expect(parsed?.data[0].payouts[0]).toMatchObject({
      status: "APPROVED",
      approvedBy: "admin-2",
      approvedAt: "2026-11-02T08:00:00.000Z",
    });
  });

  it("keeps a missing destination as null", () => {
    const parsed = parseAdminPayoutsPage(
      page([
        apiOwner({
          payouts: [
            apiPayout({
              status: "PAID",
              destinationSnapshot: null,
              destinationSnapshotStatus: "not-applicable",
            }),
          ],
        }),
      ]),
    );
    expect(parsed?.data[0].payouts[0].destination).toBeNull();
  });

  it("rejects unexpected shapes", () => {
    expect(parseAdminPayoutsPage(null)).toBeNull();
    expect(parseAdminPayoutsPage({ ...page(), total: "1" })).toBeNull();
    expect(
      parseAdminPayoutsPage(page([apiOwner({ payouts: [apiPayout({ status: "LOST" })] })])),
    ).toBeNull();
    expect(parseAdminPayoutsPage(page([apiOwner({ email: 4 })]))).toBeNull();
  });
});

describe("generating a batch", () => {
  const owner = (overrides: Partial<AdminPayoutOwner> = {}): AdminPayoutOwner => ({
    id: "o1",
    name: "Bilal",
    email: "b@example.com",
    hasBankDetails: true,
    pendingBalance: 5000,
    payouts: [],
    payoutHistoryTruncated: false,
    ...overrides,
  });

  it("needs bank details and a positive balance", () => {
    expect(canGenerateBatch(owner())).toBe(true);
    expect(canGenerateBatch(owner({ hasBankDetails: false }))).toBe(false);
    expect(canGenerateBatch(owner({ pendingBalance: 0 }))).toBe(false);
  });

  it("explains why it is blocked", () => {
    expect(generateBlockedReason(owner())).toBeNull();
    expect(generateBlockedReason(owner({ hasBankDetails: false }))).toContain("Bank details");
    expect(generateBlockedReason(owner({ pendingBalance: 0 }))).toContain("Nothing is ready");
  });
});

describe("validation and labels", () => {
  it("requires a reference of at most 200 characters", () => {
    expect(validateReference("  ")).toContain("Enter");
    expect(validateReference("x".repeat(201))).toContain("200");
    expect(validateReference("TXN-1")).toBeNull();
  });

  it("requires a void reason of 10 to 500 characters", () => {
    expect(validateVoidReason("short")).toContain("10");
    expect(validateVoidReason("x".repeat(501))).toContain("500");
    expect(validateVoidReason("Owner changed bank")).toBeNull();
  });

  it("labels audit actions", () => {
    expect(auditActionLabel("MARKED_PAID")).toBe("Marked paid");
    expect(auditActionLabel("APPROVED")).toBe("Approved by a second admin");
    expect(auditActionLabel("OTHER")).toBe("OTHER");
  });
});
