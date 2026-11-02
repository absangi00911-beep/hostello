export const ADMIN_VERIFICATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type AdminVerificationStatus = (typeof ADMIN_VERIFICATION_STATUSES)[number];

export const ADMIN_VERIFICATION_TABS: ReadonlyArray<{
  value: AdminVerificationStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export type VerificationDecision = "approve" | "reject";

export interface AdminVerification {
  id: string;
  name: string;
  email: string;
  city: string | null;
  /** Same-origin admin document URL; null when no document can be shown. */
  documentUrl: string | null;
  documentContentType: string | null;
  submittedAt: string | null;
  bookingCount: number;
}

export interface AdminVerificationsPage {
  data: AdminVerification[];
  total: number;
  page: number;
  hasMore: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseVerification(value: unknown): AdminVerification | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string"
  ) {
    return null;
  }
  const count = isRecord(value._count) ? value._count.bookings : null;
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    city: typeof value.city === "string" && value.city ? value.city : null,
    documentUrl:
      typeof value.verificationDocUrl === "string" && value.verificationDocUrl
        ? value.verificationDocUrl
        : null,
    documentContentType:
      typeof value.verificationDocContentType === "string"
        ? value.verificationDocContentType
        : null,
    submittedAt: isValidDateString(value.verificationSubmittedAt)
      ? value.verificationSubmittedAt
      : null,
    bookingCount: typeof count === "number" ? count : 0,
  };
}

/** Parses `GET /api/admin/verifications`; null when the shape is unexpected. */
export function parseAdminVerificationsPage(
  value: unknown,
): AdminVerificationsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseVerification);
  if (data.some((item) => item === null)) return null;
  return {
    data: data as AdminVerification[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

/** Images can be previewed inline; anything else (PDF) opens separately. */
export function isImageContentType(value: string | null): boolean {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

/**
 * Builds the `PUT /api/admin/verifications` body. The API accepts an optional
 * `reason` but neither stores nor sends it, so the UI does not collect one.
 */
export function buildVerificationDecisionBody(
  userId: string,
  action: VerificationDecision,
) {
  return { userId, action };
}

export function verificationDecisionMessage(
  action: VerificationDecision,
  studentName: string,
): string {
  return action === "approve"
    ? `${studentName} is now a verified student. They have been notified.`
    : `${studentName}'s verification was rejected. They have been notified and can submit a new document.`;
}
