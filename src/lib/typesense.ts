import { Client as TypesenseClient } from "typesense";

let typesenseClient: TypesenseClient | null = null;

function getClient(): TypesenseClient {
  if (typesenseClient) {
    return typesenseClient;
  }

  typesenseClient = new TypesenseClient({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST || "localhost",
        port: parseInt(process.env.TYPESENSE_PORT || "8108"),
        protocol: (process.env.TYPESENSE_PROTOCOL || "http") as "http" | "https",
      },
    ],
    apiKey: process.env.TYPESENSE_API_KEY || "",
    connectionTimeoutSeconds: 10,
    retryIntervalSeconds: 0.1,
  });

  return typesenseClient;
}

export const HOSTEL_COLLECTION_NAME = "hostels";

// ── Type Definitions ───────────────────────────────────────────────────────────

/**
 * Typesense document for a hostel.
 * Matches the Typesense collection schema defined in initializeHostelCollection.
 */
export interface HostelDocument {
  id: string;
  name: string;
  description: string;
  city: string;
  area?: string;
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
  coverImage?: string;
  latitude?: number;
  longitude?: number;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  status: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  searchText: string; // Denormalized text field for better search
}

/**
 * A single search hit from Typesense.
 * Contains the document and metadata about the match.
 */
export interface TypesenseSearchHit<T = HostelDocument> {
  document: T;
  highlights?: Array<{
    field: string;
    snippet: string;
  }>;
  text_match: number;
  text_match_info?: {
    best_field_weight: number;
    best_field_score: number;
    fields_matched: number;
  };
}

/**
 * Facet count information for a field.
 * Used for filtering UI (e.g., price ranges, amenities).
 */
export interface TypesenseFacetCount {
  count: number;
  highlighted: string;
  value: string;
}

/**
 * Facet information grouped by field.
 */
export interface TypesenseFacetInfo {
  field_name: string;
  counts: TypesenseFacetCount[];
}

/**
 * Complete search response from Typesense.
 * Provides type safety for accessing response properties.
 */
export interface TypesenseSearchResult<T = HostelDocument> {
  hits: TypesenseSearchHit<T>[];
  found: number;
  out_of: number;
  page: number;
  search_time_ms: number;
  facet_counts?: TypesenseFacetInfo[];
  search_cutoff?: boolean;
}

/**
 * Initialize the Typesense collection schema
 * Call this once during setup or when needed
 */
export async function initializeHostelCollection() {
  try {
    // Try to get the collection first
    await getClient().collections(HOSTEL_COLLECTION_NAME).retrieve();
    console.log(`✓ Collection "${HOSTEL_COLLECTION_NAME}" already exists`);
    return;
  } catch (error: unknown) {
    if (error instanceof Error && 'httpStatus' in error && (error as any).httpStatus === 404) {
      // Collection doesn't exist, create it
      console.log(`Creating collection "${HOSTEL_COLLECTION_NAME}"...`);

      const schema = {
        name: HOSTEL_COLLECTION_NAME,
        fields: [
          { name: "id", type: "string", facet: false },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "city", type: "string", facet: true },
          { name: "area", type: "string", optional: true, facet: true },
          { name: "address", type: "string" },
          { name: "pricePerMonth", type: "int32", facet: true },
          { name: "rooms", type: "int32" },
          { name: "capacity", type: "int32" },
          { name: "gender", type: "string", facet: true },
          { name: "amenities", type: "string[]", facet: true },
          { name: "rules", type: "string[]", optional: true },
          { name: "verified", type: "bool", facet: true },
          { name: "featured", type: "bool", facet: true },
          { name: "rating", type: "float", facet: true },
          { name: "reviewCount", type: "int32" },
          { name: "viewCount", type: "int32" },
          { name: "images", type: "string[]", optional: true },
          { name: "coverImage", type: "string", optional: true },
          { name: "latitude", type: "float", optional: true },
          { name: "longitude", type: "float", optional: true },
          { name: "ownerId", type: "string", facet: true },
          { name: "ownerName", type: "string" },
          { name: "ownerAvatar", type: "string", optional: true },
          { name: "status", type: "string", facet: true },
          { name: "createdAt", type: "int64", facet: true },
          { name: "updatedAt", type: "int64", facet: true },
          { name: "searchText", type: "string" }, // Denormalized for full-text search
        ],
        default_sorting_field: "createdAt",
      };

      await getClient().collections().create(schema as any);
      console.log(`✓ Collection "${HOSTEL_COLLECTION_NAME}" created successfully`);
    } else {
      throw error;
    }
  }
}

/**
 * Index a single hostel document
 */
export async function indexHostel(document: HostelDocument) {
  try {
    await getClient().collections(HOSTEL_COLLECTION_NAME).documents().upsert(document);
    console.log(`✓ Indexed hostel: ${document.name}`);
  } catch (error) {
    console.error(`✗ Failed to index hostel ${document.id}:`, error);
    throw error;
  }
}

/**
 * Index multiple hostel documents in batch
 */
export async function indexHostelsBatch(documents: HostelDocument[]) {
  try {
    const results = await getClient()
      .collections(HOSTEL_COLLECTION_NAME)
      .documents()
      .import(documents, { action: "upsert" });

    const failed = results.filter((r: any) => !r.success);
    if (failed.length > 0) {
      console.warn(`⚠ Failed to index ${failed.length}/${documents.length} documents`);
    } else {
      console.log(`✓ Indexed ${documents.length} hostels`);
    }

    return results;
  } catch (error) {
    console.error("✗ Failed to batch index hostels:", error);
    throw error;
  }
}

/**
 * Remove a hostel document from the index
 */
export async function removeHostelFromIndex(hostelId: string) {
  try {
    await getClient().collections(HOSTEL_COLLECTION_NAME).documents(hostelId).delete();
    console.log(`✓ Removed hostel from index: ${hostelId}`);
  } catch (error) {
    console.error(`✗ Failed to remove hostel ${hostelId}:`, error);
    throw error;
  }
}

/**
 * Search hostels using Typesense
 *
 * @returns TypesenseSearchResult with properly typed hits and metadata
 * @throws Error if search fails
 */
export async function searchHostels(
  q: string,
  options: {
    city?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    verified?: boolean;
    sort?: "price_asc" | "price_desc" | "rating" | "newest";
    page?: number;
    limit?: number;
  }
): Promise<TypesenseSearchResult<HostelDocument>> {
  const {
    city,
    gender,
    minPrice,
    maxPrice,
    amenities,
    verified,
    sort = "newest",
    page = 1,
    limit = 20,
  } = options;

  // Build filter string
  const filters: string[] = ["status:ACTIVE"];

  if (city) {
    filters.push(`city:${city}`);
  }

  if (gender) {
    filters.push(`gender:${gender}`);
  }

  if (verified !== undefined) {
    filters.push(`verified:${verified}`);
  }

  if (minPrice !== undefined) {
    filters.push(`pricePerMonth:>=${minPrice}`);
  }

  if (maxPrice !== undefined) {
    filters.push(`pricePerMonth:<=${maxPrice}`);
  }

  if (amenities && amenities.length > 0) {
    // For multi-value facet filters, use OR within parentheses
    const amenityFilters = amenities.map((a) => `amenities:${a}`).join(" || ");
    filters.push(`(${amenityFilters})`);
  }

  const filterBy = filters.length > 0 ? filters.join(" && ") : undefined;

  // Map sort options to Typesense sort
  const sortBy = {
    price_asc: "pricePerMonth:asc",
    price_desc: "pricePerMonth:desc",
    rating: "rating:desc",
    newest: "createdAt:desc",
  }[sort] || "createdAt:desc";

  const searchParams = {
    q: q || "*", // Use * for wildcard search
    query_by: "searchText,name,description,city,area,address",
    filter_by: filterBy,
    sort_by: sortBy,
    page,
    per_page: limit,
    facet_by: "city,gender,amenities,verified",
  };

  try {
    const results = await getClient().collections(HOSTEL_COLLECTION_NAME).documents().search(searchParams as any);
    return results as TypesenseSearchResult<HostelDocument>;
  } catch (error) {
    console.error("✗ Search failed:", error);
    throw error;
  }
}

/**
 * Delete the entire collection
 * Use with caution!
 */
export async function deleteHostelCollection() {
  try {
    await getClient().collections(HOSTEL_COLLECTION_NAME).delete();
    console.log(`✓ Deleted collection "${HOSTEL_COLLECTION_NAME}"`);
  } catch (error) {
    console.error(`✗ Failed to delete collection:`, error);
    throw error;
  }
}

/**
 * Get collection stats
 */
export async function getCollectionStats() {
  try {
    const collection = await getClient()
      .collections(HOSTEL_COLLECTION_NAME)
      .retrieve();
    return {
      name: collection.name,
      documentCount: (collection as any).num_documents,
    };
  } catch (error) {
    console.error("✗ Failed to get collection stats:", error);
    throw error;
  }
}

// Export getClient as default for backwards compatibility
export { getClient };
