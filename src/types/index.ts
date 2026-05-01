import type { Hostel, User as PrismaUser, Review, Booking, Room } from "@prisma/client";
import type { DefaultSession } from "next-auth";

export type { Hostel, Review, Booking, Room };
export type User = PrismaUser;

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

export interface CompareItem {
  slug: string;
  name: string;
  image: string | null;
}

export interface AmenityConfig {
  id: string;
  label: string;
  icon: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export type UserRole = "STUDENT" | "OWNER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
    };
  }
  interface User {
    role: UserRole;
    tokenVersion?: number;
    emailVerified?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    emailVerified?: boolean;
    tokenVersion?: number; // mirrors User.tokenVersion; mismatch means password was reset
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: UserRole;
    tokenVersion?: number;
  }
}