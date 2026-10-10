export const CANCELLATION_POLICIES = ["FLEXIBLE", "STANDARD", "STRICT"] as const;
export type CancellationPolicy = (typeof CANCELLATION_POLICIES)[number];

export const CANCELLATION_POLICY_DETAILS: Record<
  CancellationPolicy,
  { label: string; fullRefund: string; partialRefund: string; noRefund: string }
> = {
  FLEXIBLE: {
    label: "Flexible",
    fullRefund: "100% refund when you cancel at least 48 hours before check-in.",
    partialRefund: "50% refund when you cancel at least 24 hours but less than 48 hours before check-in.",
    noRefund: "No refund for cancellations less than 24 hours before check-in or after check-in.",
  },
  STANDARD: {
    label: "Standard",
    fullRefund: "100% refund when you cancel at least 7 days before check-in.",
    partialRefund: "50% refund when you cancel at least 72 hours but less than 7 days before check-in.",
    noRefund: "No refund for cancellations less than 72 hours before check-in or after check-in.",
  },
  STRICT: {
    label: "Strict",
    fullRefund: "No full refund under this policy.",
    partialRefund: "50% refund when you cancel at least 14 days before check-in.",
    noRefund: "No refund for cancellations less than 14 days before check-in or after check-in.",
  },
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function cancellationPolicySummary(policy: CancellationPolicy): string {
  const details = CANCELLATION_POLICY_DETAILS[policy];
  return `${details.fullRefund} ${details.partialRefund} ${details.noRefund}`;
}

/** Returns the whole-PKR refund amount under the approved owner-selected terms. */
export function getCancellationRefundAmount(
  policy: CancellationPolicy,
  total: number,
  checkIn: Date,
  cancelledAt: Date,
): number {
  const timeUntilCheckIn = checkIn.getTime() - cancelledAt.getTime();
  let refundRate = 0;

  switch (policy) {
    case "FLEXIBLE":
      refundRate = timeUntilCheckIn >= 48 * HOUR_MS ? 1 : timeUntilCheckIn >= 24 * HOUR_MS ? 0.5 : 0;
      break;
    case "STANDARD":
      refundRate = timeUntilCheckIn >= 7 * DAY_MS ? 1 : timeUntilCheckIn >= 72 * HOUR_MS ? 0.5 : 0;
      break;
    case "STRICT":
      refundRate = timeUntilCheckIn >= 14 * DAY_MS ? 0.5 : 0;
      break;
  }

  return Math.round(total * refundRate);
}
