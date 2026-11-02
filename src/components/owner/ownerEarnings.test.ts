import { describe, expect, it } from "vitest";
import {
  maskAccountNumber,
  parseEarnings,
  parseSavedBankDetails,
  validateBankDetails,
} from "./ownerEarnings";

const payout = {
  id: "p1",
  amount: 24000,
  status: "PAID",
  reference: "TXN-1",
  createdAt: "2026-10-20T09:00:00.000Z",
  paidAt: "2026-10-22T09:00:00.000Z",
};

const response = {
  pendingBalance: 18000,
  hasBankDetails: true,
  bankDetails: {
    bankAccountTitle: "Sana Khan",
    bankAccountNumber: "PK36SCBL0000001123456702",
    bankName: "Standard Chartered",
  },
  payouts: [payout],
  payoutTotal: 1,
  payoutPage: 1,
  payoutLimit: 20,
  payoutHasMore: false,
};

describe("parseEarnings", () => {
  it("accepts the /api/owner/earnings shape", () => {
    const parsed = parseEarnings(response);

    expect(parsed?.pendingBalance).toBe(18000);
    expect(parsed?.bankDetails?.bankName).toBe("Standard Chartered");
    expect(parsed?.payouts[0]).toEqual(payout);
  });

  it("normalizes missing bank details and payout nulls", () => {
    const parsed = parseEarnings({
      ...response,
      hasBankDetails: false,
      bankDetails: null,
      payouts: [{ ...payout, status: "PENDING", reference: null, paidAt: null }],
    });

    expect(parsed?.bankDetails).toBeNull();
    expect(parsed?.payouts[0]).toMatchObject({ reference: null, paidAt: null });
  });

  it("rejects unknown payout statuses, bad dates and malformed payloads", () => {
    expect(parseEarnings({ ...response, payouts: [{ ...payout, status: "LOST" }] })).toBeNull();
    expect(parseEarnings({ ...response, payouts: [{ ...payout, createdAt: "x" }] })).toBeNull();
    expect(parseEarnings({ ...response, pendingBalance: "18000" })).toBeNull();
    expect(parseEarnings(null)).toBeNull();
  });
});

describe("parseSavedBankDetails", () => {
  it("reads the PATCH response", () => {
    expect(parseSavedBankDetails({ bankDetails: response.bankDetails })).toEqual(
      response.bankDetails,
    );
    expect(parseSavedBankDetails({ error: "no" })).toBeNull();
  });
});

describe("maskAccountNumber", () => {
  it("hides everything except the last four characters", () => {
    expect(maskAccountNumber("PK36SCBL0000001123456702")).toBe("•••• 6702");
    expect(maskAccountNumber("0123 4567 8901")).toBe("•••• 8901");
    expect(maskAccountNumber("123")).toBe("••••");
  });
});

describe("validateBankDetails", () => {
  const valid = {
    bankAccountTitle: "Sana Khan",
    bankAccountNumber: "0123456789",
    bankName: "HBL",
  };

  it("accepts complete details", () => {
    expect(validateBankDetails(valid)).toBeNull();
  });

  it("requires every field and enforces the server length limits", () => {
    expect(validateBankDetails({ ...valid, bankName: "  " })).toMatch(/all bank detail/);
    expect(
      validateBankDetails({ ...valid, bankAccountNumber: "9".repeat(61) }),
    ).toMatch(/at most 60/);
  });
});
