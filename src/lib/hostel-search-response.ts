import { db } from "@/lib/db";

export async function fetchHostelSearchResults(hostelIds: string[]) {
  const hostels = hostelIds.length
    ? await db.hostel.findMany({
        where: { id: { in: hostelIds }, status: "ACTIVE" },
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          area: true,
          pricePerMonth: true,
          coverImage: true,
          images: true,
          rating: true,
          reviewCount: true,
        },
      })
    : [];

  const byId = new Map(hostels.map((hostel) => [hostel.id, hostel]));
  return hostelIds
    .map((id) => byId.get(id))
    .filter((hostel): hostel is NonNullable<typeof hostel> => hostel !== undefined)
    .map((hostel) => ({
      id: hostel.id,
      slug: hostel.slug,
      name: hostel.name,
      city: hostel.city,
      area: hostel.area,
      pricePerMonth: hostel.pricePerMonth,
      coverImage: hostel.coverImage,
      images: hostel.images,
      rating: hostel.rating,
      reviewCount: hostel.reviewCount,
    }));
}
