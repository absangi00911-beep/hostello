import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { newListingAdminEmail } from "@/lib/email-templates/new-listing";
import { slugify } from "@/lib/utils";
import type { HostelCreateInput } from "@/lib/validations";

/**
 * Shared hostel creation service used by both POST /api/hostels and POST /api/hostels/create.
 * 
 * Handles:
 * - Slug generation with collision detection
 * - Database record creation
 * - Admin notification email (fire-and-forget, never blocks response)
 */
export async function createHostelRecord(
  ownerId: string,
  ownerName: string,
  ownerEmail: string,
  data: HostelCreateInput,
  body: Record<string, unknown>
) {
  // Generate a unique slug
  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let attempt = 0;
  const MAX_SLUG_ATTEMPTS = 10;

  while (
    attempt < MAX_SLUG_ATTEMPTS &&
    (await db.hostel.findUnique({ where: { slug }, select: { id: true } }))
  ) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // If max attempts reached, use timestamp as fallback
  if (attempt === MAX_SLUG_ATTEMPTS) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  const hostel = await db.hostel.create({
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
      images: Array.isArray(body.images) ? body.images : [],
      coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
      status: "PENDING_REVIEW",
      ownerId,
    },
    select: { id: true, slug: true, name: true, status: true, city: true, pricePerMonth: true },
  });

  // Notify admin of new listing — fire and forget, never blocks the response
  void sendEmail(
    newListingAdminEmail({
      ownerName,
      ownerEmail,
      hostelName: hostel.name,
      hostelId: hostel.id,
      city: hostel.city,
      pricePerMonth: hostel.pricePerMonth,
    })
  ).catch((err) => console.error("[hostel-service] Admin notification failed:", err));

  return hostel;
}
