// Path: src/lib/hostel-service.ts

import { Prisma } from "@/generated/client";
import { sendEmail } from "@/lib/email";
import { newListingAdminEmail } from "@/lib/email-templates/new-listing";
import { slugify } from "@/lib/utils";
import type { HostelCreateInput } from "@/lib/validations";
import { getSafeErrorSummary } from "@/lib/safe-error";

/**
 * Creates a hostel record inside the caller's transaction. Notification is
 * deliberately handled after commit by the route.
 *
 * Handles:
 * - Slug generation with collision detection
 * - Database record creation
 */
export async function createHostelRecord(
  client: Pick<Prisma.TransactionClient, "hostel">,
  ownerId: string,
  data: HostelCreateInput
) {
  // Generate a unique slug
  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let attempt = 0;
  const MAX_SLUG_ATTEMPTS = 10;

  while (
    attempt < MAX_SLUG_ATTEMPTS &&
    (await client.hostel.findUnique({ where: { slug }, select: { id: true } }))
  ) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // If max attempts reached, use timestamp as fallback
  if (attempt === MAX_SLUG_ATTEMPTS) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  return client.hostel.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      city: data.city,
      area: data.area ?? null,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      pricePerMonth: data.pricePerMonth,
      rooms: data.rooms,
      capacity: data.capacity,
      gender: data.gender,
      minStay: data.minStay,
      maxStay: data.maxStay ?? null,
      amenities: data.amenities,
      rules: data.rules ?? [],
      images: data.images ?? [],
      coverImage: data.coverImage ?? null,
      status: "PENDING_REVIEW",
      ownerId,
    },
    select: { id: true, slug: true, name: true, status: true, city: true, pricePerMonth: true },
  });
}

export function notifyAdminOfNewListing(
  ownerName: string,
  ownerEmail: string,
  hostel: {
    id: string;
    name: string;
    city: string;
    pricePerMonth: number;
  },
) {
  // Notify admin only after the listing transaction has committed.
  void sendEmail(
    newListingAdminEmail({
      ownerName,
      ownerEmail,
      hostelName: hostel.name,
      hostelId: hostel.id,
      city: hostel.city,
      pricePerMonth: hostel.pricePerMonth,
    })
  ).catch((err) =>
    console.error(
      "[hostel-service] Admin notification failed:",
      getSafeErrorSummary(err),
    ),
  );

  return hostel;
}

export function hostelIdOrSlugWhere(param: string) {
  return { OR: [{ id: param }, { slug: param }] };
}
