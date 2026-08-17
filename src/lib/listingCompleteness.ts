// Path: src/lib/listingCompleteness.ts

/**
 * A transparent, computed "how ready is this listing" score — NOT a stored
 * field, NOT an AI/ML trust signal. HostelLo's schema has no trust-score or
 * flagging concept, so rather than invent one, this scores what's genuinely
 * checkable: how complete the listing content is. Used for the completeness
 * bar in the admin table/drawer, and as the basis for "flagged" (low score).
 *
 * Deliberately does NOT factor in owner reputation, review rating, or
 * anything else — this is about the LISTING's own content, not the owner.
 */

export interface CompletenessInput {
  images: string[];
  description: string;
  amenities: string[];
  rules: string[];
}

export interface CompletenessFactor {
  label: string;
  points: number;
  max: number;
  hint: string;
}

export interface CompletenessResult {
  score: number; // 0-100
  factors: CompletenessFactor[];
}

export const FLAGGED_THRESHOLD = 50;

export function computeListingCompleteness(hostel: CompletenessInput): CompletenessResult {
  const photoCount = hostel.images?.length ?? 0;
  const photoPoints =
    photoCount >= 5 ? 35 : photoCount >= 3 ? 25 : photoCount >= 1 ? 12 : 0;

  const descLen = hostel.description?.trim().length ?? 0;
  const descPoints = descLen >= 200 ? 30 : descLen >= 80 ? 18 : descLen > 0 ? 6 : 0;

  const amenityCount = hostel.amenities?.length ?? 0;
  const amenityPoints = amenityCount >= 5 ? 20 : amenityCount >= 2 ? 12 : amenityCount >= 1 ? 5 : 0;

  const rulesCount = hostel.rules?.length ?? 0;
  const rulesPoints = rulesCount > 0 ? 15 : 0;

  const factors: CompletenessFactor[] = [
    { label: "Photos",      points: photoPoints,   max: 35, hint: photoCount === 0 ? "No photos yet" : `${photoCount} photo${photoCount === 1 ? "" : "s"}` },
    { label: "Description", points: descPoints,    max: 30, hint: descLen === 0 ? "No description" : `${descLen} characters` },
    { label: "Amenities",   points: amenityPoints, max: 20, hint: amenityCount === 0 ? "None listed" : `${amenityCount} listed` },
    { label: "House rules", points: rulesPoints,   max: 15, hint: rulesCount === 0 ? "None listed" : `${rulesCount} listed` },
  ];

  return {
    score: photoPoints + descPoints + amenityPoints + rulesPoints,
    factors,
  };
}
