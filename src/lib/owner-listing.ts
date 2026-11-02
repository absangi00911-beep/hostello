import { db } from "@/lib/db";
import type { StoredListing } from "@/components/owner/listingForm";

export interface OwnerListingForEdit extends StoredListing {
  id: string;
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";
}

/**
 * Loads one listing for the owner edit page, scoped by `ownerId`. There is no
 * owner-readable `GET /api/hostels/[param]` (it is admin-only), so the page
 * reads the database directly. Returns null for unknown ids and for listings
 * that belong to someone else, so the two cases look the same.
 */
export async function getOwnerListingForEdit(
  ownerId: string,
  hostelId: string,
): Promise<OwnerListingForEdit | null> {
  if (!hostelId || hostelId.length > 64) return null;

  const hostel = await db.hostel.findFirst({
    where: { id: hostelId, ownerId },
    select: {
      id: true,
      status: true,
      name: true,
      description: true,
      gender: true,
      city: true,
      area: true,
      address: true,
      latitude: true,
      longitude: true,
      amenities: true,
      images: true,
      minStay: true,
      maxStay: true,
      cancellationPolicy: true,
      rules: true,
      rooms_rel: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerMonth: true,
          capacity: true,
          facilities: true,
          images: true,
        },
      },
    },
  });
  if (!hostel) return null;

  const { rooms_rel, ...rest } = hostel;
  return { ...rest, rooms: rooms_rel };
}

export interface OwnerListingSummary {
  id: string;
  name: string;
  status: OwnerListingForEdit["status"];
}

/**
 * Minimal owner-scoped lookup for pages that only need the listing's identity
 * (for example the blocked-dates page). Null for unknown ids and for listings
 * that belong to someone else.
 */
export async function getOwnerListingSummary(
  ownerId: string,
  hostelId: string,
): Promise<OwnerListingSummary | null> {
  if (!hostelId || hostelId.length > 64) return null;
  return db.hostel.findFirst({
    where: { id: hostelId, ownerId },
    select: { id: true, name: true, status: true },
  });
}
