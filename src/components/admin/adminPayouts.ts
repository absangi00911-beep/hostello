export type PayoutStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
export type DestinationStatus =
  | "available"
  | "missing"
  | "unavailable"
  | "not-applicable";

export interface PayoutDestination {
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface PayoutAuditEntry {
  id: string;
  action: string;
  reference: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminPayout {
  id: string;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  destination: PayoutDestination | null;
  destinationStatus: DestinationStatus;
  auditEvents: PayoutAuditEntry[];
}

export interface AdminPayoutOwner {
  id: string;
  name: string;
  email: string;
  hasBankDetails: boolean;
  pendingBalance: number;
  payouts: AdminPayout[];
  payoutHistoryTruncated: boolean;
}

export interface AdminPayoutsPage {
  data: AdminPayoutOwner[];
  total: number;
  page: number;
  hasMore: boolean;
  payoutHistoryPerOwner: number;
}

export const VOID_REASON_MIN = 10;
export const VOID_REASON_MAX = 500;
export const REFERENCE_MAX = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

const STATUSES: readonly string[] = ["PENDING", "APPROVED", "PAID", "CANCELLED"];
const DESTINATION_STATUSES: readonly string[] = [
  "available",
  "missing",
  "unavailable",
  "not-applicable",
];

function parseDestination(value: unknown): PayoutDestination | null {
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

function parseAudit(value: unknown): PayoutAuditEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.action !== "string" ||
    !isValidDateString(value.createdAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    action: value.action,
    reference: optionalString(value.reference),
    reason: optionalString(value.reason),
    createdAt: value.createdAt,
  };
}

function parsePayout(value: unknown): AdminPayout | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.status !== "string" ||
    !STATUSES.includes(value.status) ||
    !isValidDateString(value.createdAt) ||
    typeof value.destinationSnapshotStatus !== "string" ||
    !DESTINATION_STATUSES.includes(value.destinationSnapshotStatus) ||
    !Array.isArray(value.auditEvents)
  ) {
    return null;
  }
  const audit = value.auditEvents.map(parseAudit);
  if (audit.some((entry) => entry === null)) return null;
  return {
    id: value.id,
    amount: value.amount,
    status: value.status as PayoutStatus,
    reference: optionalString(value.reference),
    approvedBy: optionalString(value.approvedBy),
    approvedAt: isValidDateString(value.approvedAt) ? value.approvedAt : null,
    createdAt: value.createdAt,
    paidAt: isValidDateString(value.paidAt) ? value.paidAt : null,
    cancelledAt: isValidDateString(value.cancelledAt) ? value.cancelledAt : null,
    cancellationReason: optionalString(value.cancellationReason),
    destination: parseDestination(value.destinationSnapshot),
    destinationStatus: value.destinationSnapshotStatus as DestinationStatus,
    auditEvents: audit as PayoutAuditEntry[],
  };
}

function parseOwner(value: unknown): AdminPayoutOwner | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string" ||
    typeof value.hasBankDetails !== "boolean" ||
    typeof value.pendingBalance !== "number" ||
    !Array.isArray(value.payouts)
  ) {
    return null;
  }
  const payouts = value.payouts.map(parsePayout);
  if (payouts.some((payout) => payout === null)) return null;
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    hasBankDetails: value.hasBankDetails,
    pendingBalance: value.pendingBalance,
    payouts: payouts as AdminPayout[],
    payoutHistoryTruncated: value.payoutHistoryTruncated === true,
  };
}

/** Parses `GET /api/admin/payouts`; null when the shape is unexpected. */
export function parseAdminPayoutsPage(value: unknown): AdminPayoutsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseOwner);
  if (data.some((owner) => owner === null)) return null;
  return {
    data: data as AdminPayoutOwner[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
    payoutHistoryPerOwner:
      typeof value.payoutHistoryPerOwner === "number"
        ? value.payoutHistoryPerOwner
        : 20,
  };
}

/** Can a batch be generated right now? Mirrors the API's preconditions. */
export function canGenerateBatch(owner: AdminPayoutOwner): boolean {
  return owner.hasBankDetails && owner.pendingBalance > 0;
}

export function generateBlockedReason(owner: AdminPayoutOwner): string | null {
  if (!owner.hasBankDetails) {
    return "Bank details are incomplete, so a batch cannot be generated.";
  }
  if (owner.pendingBalance <= 0) return "Nothing is ready for payout.";
  return null;
}

export function validateReference(reference: string): string | null {
  const trimmed = reference.trim();
  if (!trimmed) return "Enter the transfer reference from the bank.";
  if (trimmed.length > REFERENCE_MAX) {
    return `The reference can be at most ${REFERENCE_MAX} characters.`;
  }
  return null;
}

export function validateVoidReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < VOID_REASON_MIN) {
    return `Explain why in at least ${VOID_REASON_MIN} characters.`;
  }
  if (length > VOID_REASON_MAX) {
    return `The reason can be at most ${VOID_REASON_MAX} characters.`;
  }
  return null;
}

export function auditActionLabel(action: string): string {
  if (action === "BATCH_CREATED") return "Batch created";
  if (action === "APPROVED") return "Approved by a second admin";
  if (action === "MARKED_PAID") return "Marked paid";
  if (action === "VOIDED") return "Voided";
  return action;
}
