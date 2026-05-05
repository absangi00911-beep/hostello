import { db } from "@/lib/db";
import { indexHostel, indexHostelsBatch, removeHostelFromIndex, HostelDocument } from "@/lib/typesense";

/**
 * Convert a Prisma Hostel to a Typesense document
 */
export async function hostelToTypesenseDocument(hostelId: string): Promise<HostelDocument | null> {
  const hostel = await db.hostel.findUnique({
    where: { id: hostelId },
    include: {
      owner: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!hostel) {
    return null;
  }

  const searchText = [
    hostel.name,
    hostel.description,
    hostel.city,
    hostel.area,
    hostel.address,
    hostel.amenities.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: hostel.id,
    name: hostel.name,
    description: hostel.description,
    city: hostel.city,
    area: hostel.area || undefined,
    address: hostel.address,
    pricePerMonth: hostel.pricePerMonth,
    rooms: hostel.rooms,
    capacity: hostel.capacity,
    gender: hostel.gender,
    amenities: hostel.amenities,
    rules: hostel.rules,
    verified: hostel.verified,
    featured: hostel.featured,
    rating: hostel.rating,
    reviewCount: hostel.reviewCount,
    viewCount: hostel.viewCount,
    images: hostel.images,
    coverImage: hostel.coverImage || undefined,
    latitude: hostel.latitude || undefined,
    longitude: hostel.longitude || undefined,
    ownerId: hostel.ownerId,
    ownerName: hostel.owner.name,
    ownerAvatar: hostel.owner.avatar || undefined,
    status: hostel.status,
    createdAt: Math.floor(hostel.createdAt.getTime() / 1000),
    updatedAt: Math.floor(hostel.updatedAt.getTime() / 1000),
    searchText,
  };
}

/**
 * Index a single hostel
 */
export async function indexSingleHostel(hostelId: string) {
  const document = await hostelToTypesenseDocument(hostelId);
  if (!document) {
    console.warn(`Hostel ${hostelId} not found`);
    return;
  }
  await indexHostel(document);
}

/**
 * Sync all active hostels to Typesense
 * This should be run periodically or after data migrations
 */
export async function syncAllHostelsToTypesense() {
  console.log("Starting hostel sync to Typesense...");

  try {
    // Fetch all active hostels with owner info
    const hostels = await db.hostel.findMany({
      where: { status: "ACTIVE" },
      include: {
        owner: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${hostels.length} active hostels to sync`);

    // Convert to Typesense documents
    const documents = await Promise.all(
      hostels.map((hostel) => hostelToTypesenseDocument(hostel.id))
    );
    const validDocuments = documents.filter((d): d is HostelDocument => d !== null);

    // Index in batches of 100
    const batchSize = 100;
    for (let i = 0; i < validDocuments.length; i += batchSize) {
      const batch = validDocuments.slice(i, i + batchSize);
      await indexHostelsBatch(batch);
    }

    console.log("✓ Sync completed successfully");
  } catch (error) {
    console.error("✗ Sync failed:", error);
    throw error;
  }
}

/**
 * Remove a hostel from Typesense index
 */
export async function removeHostelIndex(hostelId: string) {
  await removeHostelFromIndex(hostelId);
}
