// Path: src/types/index.ts

import type { Hostel as PrismaHostel, User as PrismaUser, Review as PrismaReview, Booking as PrismaBooking, Room } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import type { 
  UserRole, 
  HostelFilters, 
  SearchParams, 
  PaginatedResponse, 
  ApiResponse, 
  AmenityConfig, 
  CompareItem,
  HostelWithOwner,
  HostelWithDetails,
  ReviewWithUser,
  BookingWithHostel
} from "@hostello/shared/types";

export type { 
  UserRole,
  HostelFilters,
  SearchParams,
  PaginatedResponse,
  ApiResponse,
  AmenityConfig,
  CompareItem,
  HostelWithOwner,
  HostelWithDetails,
  ReviewWithUser,
  BookingWithHostel,
  Room
};

// Use Prisma types for core entities in the web app to maintain backend compatibility
export type Hostel = PrismaHostel;
export type User = PrismaUser;
export type Review = PrismaReview;
export type Booking = PrismaBooking;

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