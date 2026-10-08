// Path: src/lib/typesense-sync.ts

import { db } from "@/lib/db";
import { indexHostel, indexHostelsBatch, removeHostelFromIndex } from "@/lib/typesense";
import type { HostelDocument } from "@/lib/typesense";
import { getSafeErrorSummary } from "@/lib/safe-error";

const HOSTEL_INDEX_SELECT = {
  id: true,
  name: true,
  description: true,
  city: true,
  area: true,
  address: true,
  pricePerMonth: true,
  rooms: true,
  capacity: true,
  gender: true,
  amenities: true,
  rules: true,
  verified: true,
  featured: true,
  rating: true,
  reviewCount: true,
  viewCount: true,
  images: true,
  coverImage: true,
  latitude: true,
  longitude: true,
  ownerId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { name: true, avatar: true } },
} as const;

type HostelIndexRow = {
  id: string;
  name: string;
  description: string;
  city: string;
  area: string | null;
  address: string;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  gender: string;
  amenities: string[];
  rules: string[];
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  images: string[];
  coverImage: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  owner: { name: string; avatar: string | null };
};

function toTypesenseDocument(hostel: HostelIndexRow): HostelDocument {
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
 * Convert a Prisma Hostel to a Typesense document
 */
export async function hostelToTypesenseDocument(hostelId: string): Promise<HostelDocument | null> {
  const hostel = await db.hostel.findUnique({
    where: { id: hostelId },
    select: HOSTEL_INDEX_SELECT,
  });

  if (!hostel) {
    return null;
  }
  return toTypesenseDocument(hostel);
}

/**
 * Index a single hostel
 */
export async function indexSingleHostel(hostelId: string) {
  const document = await hostelToTypesenseDocument(hostelId);
  if (!document) {
    console.warn("Hostel was not found during Typesense sync");
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
    let lastId: string | undefined;
    let synced = 0;

    while (true) {
      const hostels = await db.hostel.findMany({
        where: {
          status: "ACTIVE",
          ...(lastId ? { id: { gt: lastId } } : {}),
        },
        select: HOSTEL_INDEX_SELECT,
        orderBy: { id: "asc" },
        take: 100,
      });

      if (hostels.length === 0) break;

      await indexHostelsBatch(hostels.map(toTypesenseDocument));
      synced += hostels.length;
      lastId = hostels[hostels.length - 1].id;
      if (hostels.length < 100) break;
    }

    console.log(`✓ Synced ${synced} active hostels`);
  } catch (error) {
    console.error("✗ Sync failed:", getSafeErrorSummary(error));
    throw error;
  }
}

/**
 * Remove a hostel from Typesense index
 */
export async function removeHostelIndex(hostelId: string) {
  await removeHostelFromIndex(hostelId);
}
