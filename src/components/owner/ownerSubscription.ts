export const SUBSCRIPTION_STATUSES = [
  "PENDING",
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type OwnerPlan = "FREE" | "PRO";

export interface OwnerSubscriptionInfo {
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface OwnerSubscription {
  plan: OwnerPlan;
  subscription: OwnerSubscriptionInfo | null;
  listingCount: number;
}

/** Where Safepay sent the owner back to (`?upgraded=1` / `?cancelled=1`). */
export type SubscriptionReturnState = "upgraded" | "cancelled" | null;

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: "Awaiting payment",
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseSubscriptionInfo(value: unknown): OwnerSubscriptionInfo | null {
  if (
    !isRecord(value) ||
    typeof value.status !== "string" ||
    !(SUBSCRIPTION_STATUSES as readonly string[]).includes(value.status)
  ) {
    return null;
  }
  return {
    status: value.status as SubscriptionStatus,
    startDate: isValidDateString(value.startDate) ? value.startDate : null,
    endDate: isValidDateString(value.endDate) ? value.endDate : null,
  };
}

/** Parses `GET /api/owner/subscription`; null when the shape is unexpected. */
export function parseSubscription(value: unknown): OwnerSubscription | null {
  if (
    !isRecord(value) ||
    (value.plan !== "FREE" && value.plan !== "PRO") ||
    typeof value.listingCount !== "number"
  ) {
    return null;
  }
  return {
    plan: value.plan,
    subscription: parseSubscriptionInfo(value.subscription),
    listingCount: value.listingCount,
  };
}

/** Reads `{ checkoutUrl }` from the POST response; only https links are used. */
export function parseCheckoutUrl(value: unknown): string | null {
  if (!isRecord(value) || typeof value.checkoutUrl !== "string") return null;
  try {
    const url = new URL(value.checkoutUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function readSubscriptionError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function parseReturnState(
  params: { upgraded?: string | string[]; cancelled?: string | string[] },
): SubscriptionReturnState {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  if (first(params.upgraded) === "1") return "upgraded";
  if (first(params.cancelled) === "1") return "cancelled";
  return null;
}
