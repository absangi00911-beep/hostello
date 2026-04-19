import type { Hostel, User, Review, Booking, Room } from "@prisma/client";

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { Hostel, User, Review, Booking, Room };

// ─── Compound types ──────────────────────────────────────────────────────────

export type HostelWithOwner = Hostel & {
  owner: Pick<User, "id" | "name" | "avatar" | "phone">;
};

export type HostelWithDetails = HostelWithOwner & {
  reviews: ReviewWithUser[];
  _count: { favorites: number };
};

export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "avatar">;
};

export type BookingWithHostel = Booking & {
  hostel: Pick<Hostel, "id" | "name" | "slug" | "coverImage" | "city">;
};

// ─── Search & filter types ───────────────────────────────────────────────────

export interface HostelFilters {
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
  q?: string;
}

export interface SearchParams extends HostelFilters {
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Compare store types ─────────────────────────────────────────────────────

export interface CompareItem {
  slug: string;
  name: string;
  image: string | null;
}

// ─── Amenity config ───────────────────────────────────────────────────────────

export interface AmenityConfig {
  id: string;
  label: string;
  icon: string;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export type UserRole = "STUDENT" | "OWNER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: UserRole;
    };
  }
  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
