export const PAYOUT_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export interface BankDetails {
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface OwnerPayout {
  id: string;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface OwnerEarnings {
  pendingBalance: number;
  hasBankDetails: boolean;
  bankDetails: BankDetails | null;
  payouts: OwnerPayout[];
  payoutTotal: number;
  payoutPage: number;
  payoutHasMore: boolean;
}

/** Same limits as `bankDetailsSchema` in `src/app/api/owner/earnings/route.ts`. */
export const BANK_LIMITS = {
  bankAccountTitle: 120,
  bankAccountNumber: 60,
  bankName: 120,
} as const;

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "Being processed",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseBankDetails(value: unknown): BankDetails | null {
  if (
    !isRecord(value) ||
    typeof value.bankAccountTitle !== "string" ||
    typeof value.bankAccountNumber !== "string" ||
    typeof value.bankName !== "string"
  ) {
    return null;
  }
  return {
    bankAccountTitle: value.bankAccountTitle,
    bankAccountNumber: value.bankAccountNumber,
    bankName: value.bankName,
  };
}

function parsePayout(value: unknown): OwnerPayout | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.status !== "string" ||
    !(PAYOUT_STATUSES as readonly string[]).includes(value.status) ||
    !(value.reference == null || typeof value.reference === "string") ||
    !isValidDateString(value.createdAt) ||
    !(value.paidAt == null || isValidDateString(value.paidAt))
  ) {
    return null;
  }
  return {
    id: value.id,
    amount: value.amount,
    status: value.status as PayoutStatus,
    reference: typeof value.reference === "string" ? value.reference : null,
    createdAt: value.createdAt,
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
  };
}

/** Parses `GET /api/owner/earnings`; null when the shape is unexpected. */
export function parseEarnings(value: unknown): OwnerEarnings | null {
  if (
    !isRecord(value) ||
    typeof value.pendingBalance !== "number" ||
    typeof value.hasBankDetails !== "boolean" ||
    !Array.isArray(value.payouts) ||
    typeof value.payoutTotal !== "number" ||
    typeof value.payoutPage !== "number" ||
    typeof value.payoutHasMore !== "boolean"
  ) {
    return null;
  }
  const payouts = value.payouts.map(parsePayout);
  if (payouts.some((payout) => payout === null)) return null;
  return {
    pendingBalance: value.pendingBalance,
    hasBankDetails: value.hasBankDetails,
    bankDetails: parseBankDetails(value.bankDetails),
    payouts: payouts as OwnerPayout[],
    payoutTotal: value.payoutTotal,
    payoutPage: value.payoutPage,
    payoutHasMore: value.payoutHasMore,
  };
}

/** Reads `{ bankDetails }` from the PATCH response. */
export function parseSavedBankDetails(value: unknown): BankDetails | null {
  return isRecord(value) ? parseBankDetails(value.bankDetails) : null;
}

export function readEarningsError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

/** Shows only the last four characters; the API returns the full number. */
export function maskAccountNumber(accountNumber: string): string {
  const compact = accountNumber.replace(/\s+/g, "");
  if (compact.length <= 4) return "••••";
  return `•••• ${compact.slice(-4)}`;
}

export function validateBankDetails(values: BankDetails): string | null {
  const title = values.bankAccountTitle.trim();
  const number = values.bankAccountNumber.trim();
  const bank = values.bankName.trim();
  if (!title || !number || !bank) return "Please fill in all bank detail fields.";
  if (title.length > BANK_LIMITS.bankAccountTitle) {
    return `Account title can be at most ${BANK_LIMITS.bankAccountTitle} characters.`;
  }
  if (number.length > BANK_LIMITS.bankAccountNumber) {
    return `Account number can be at most ${BANK_LIMITS.bankAccountNumber} characters.`;
  }
  if (bank.length > BANK_LIMITS.bankName) {
    return `Bank name can be at most ${BANK_LIMITS.bankName} characters.`;
  }
  return null;
}
