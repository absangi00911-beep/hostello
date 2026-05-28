export const PLANS = {
  FREE: {
    label:       "Free",
    price:       0,
    maxListings: 1,
    featured:    false,
    analytics:   "basic" as const,
    support:     "community" as const,
    perks: [
      "1 active listing",
      "Basic analytics (views & bookings)",
      "Standard search placement",
    ],
  },
  PRO: {
    label:       "Pro",
    price:       3_000,           // PKR per month
    maxListings: Infinity,
    featured:    true,
    analytics:   "full" as const,
    support:     "priority" as const,
    perks: [
      "Unlimited listings",
      "Featured placement in search",
      "Full analytics (revenue, conversion)",
      "Priority support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: PlanKey) {
  return PLANS[plan];
}

export function canAddListing(plan: PlanKey, currentCount: number): boolean {
  return currentCount < PLANS[plan].maxListings;
}
