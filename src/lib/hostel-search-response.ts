import { db } from "@/lib/db";

export async function fetchHostelSearchResults(hostelIds: string[]) {
  const hostels = hostelIds.length
    ? await db.hostel.findMany({
        where: { id: { in: hostelIds }, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          area: true,
          pricePerMonth: true,
          gender: true,
          amenities: true,
          coverImage: true,
          images: true,
          verified: true,
          featured: true,
          rating: true,
          reviewCount: true,
          safetyScore: true,
          capacity: true,
          rooms: true,
          latitude: true,
          longitude: true,
          owner: {
            select: { id: true, name: true, avatar: true },
          },
        },
      })
    : [];

  const byId = new Map(hostels.map((hostel) => [hostel.id, hostel]));
  return hostelIds
    .map((id) => byId.get(id))
    .filter((hostel): hostel is NonNullable<typeof hostel> => hostel !== undefined);
}
